import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getUserIdFromSession, findUserById,
  saveMeal, getMealsForUser, deleteMeal,
  type MealEntry,
} from '@/lib/store'

async function getUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sf_session')?.value
  if (!sessionId) return null
  const userId = getUserIdFromSession(sessionId)
  if (!userId) return null
  return findUserById(userId) ?? null
}

function todayStr() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

/** GET /api/nutrition?date=YYYY-MM-DD — meals for a date (defaults to today) */
export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') ?? todayStr()

    const meals = getMealsForUser(user.id, date)

    // Aggregate totals for the day
    const totals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein:  acc.protein  + m.protein,
        carbs:    acc.carbs    + m.carbs,
        fat:      acc.fat      + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )

    return NextResponse.json({ meals, totals, date })
  } catch (error) {
    console.error('[nutrition GET]', error)
    return NextResponse.json({ error: 'Failed to fetch nutrition.' }, { status: 500 })
  }
}

/** POST /api/nutrition — log a meal */
export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const body = await request.json()
    const { name, calories, protein = 0, carbs = 0, fat = 0, mealType = 'Snack' } = body

    if (!name?.trim() || !calories) {
      return NextResponse.json({ error: 'Meal name and calories are required.' }, { status: 400 })
    }

    const now  = new Date()
    const meal: MealEntry = {
      id:       crypto.randomUUID(),
      userId:   user.id,
      name:     name.trim(),
      calories: Number(calories),
      protein:  Number(protein),
      carbs:    Number(carbs),
      fat:      Number(fat),
      mealType: mealType as MealEntry['mealType'],
      date:     now.toISOString().slice(0, 10),
      time:     now.toTimeString().slice(0, 5),
    }

    saveMeal(meal)
    return NextResponse.json({ success: true, meal }, { status: 201 })
  } catch (error) {
    console.error('[nutrition POST]', error)
    return NextResponse.json({ error: 'Failed to log meal.' }, { status: 500 })
  }
}

/** DELETE /api/nutrition?id=xxx — remove a meal entry */
export async function DELETE(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Meal id required.' }, { status: 400 })

    const ok = deleteMeal(id, user.id)
    if (!ok) return NextResponse.json({ error: 'Meal not found.' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[nutrition DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete meal.' }, { status: 500 })
  }
}
