import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getUserIdFromSession, findUserById,
  saveWorkout, getWorkoutsForUser, deleteWorkout,
  type WorkoutSession,
} from '@/lib/store'

async function getUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sf_session')?.value
  if (!sessionId) return null
  const userId = getUserIdFromSession(sessionId)
  if (!userId) return null
  return findUserById(userId) ?? null
}

/** GET /api/workouts — list all workouts for the logged-in user */
export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '20')

    const workouts = getWorkoutsForUser(user.id).slice(0, limit)
    return NextResponse.json({ workouts })
  } catch (error) {
    console.error('[workouts GET]', error)
    return NextResponse.json({ error: 'Failed to fetch workouts.' }, { status: 500 })
  }
}

/** POST /api/workouts — log a completed workout */
export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const body = await request.json()
    const { name, type, durationMin, intensity, notes, completed = true } = body

    if (!name || !durationMin) {
      return NextResponse.json({ error: 'Name and duration are required.' }, { status: 400 })
    }

    const now = new Date()
    const workout: WorkoutSession = {
      id:          crypto.randomUUID(),
      userId:      user.id,
      name:        name.trim(),
      type:        type ?? user.profile?.training ?? 'Strength training',
      durationMin: Number(durationMin),
      intensity:   intensity ?? 'Moderate',
      notes:       notes ?? '',
      date:        now.toISOString(),
      completed:   Boolean(completed),
    }

    saveWorkout(workout)
    return NextResponse.json({ success: true, workout }, { status: 201 })
  } catch (error) {
    console.error('[workouts POST]', error)
    return NextResponse.json({ error: 'Failed to log workout.' }, { status: 500 })
  }
}

/** DELETE /api/workouts?id=xxx — remove a workout */
export async function DELETE(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Workout id required.' }, { status: 400 })

    const ok = deleteWorkout(id, user.id)
    if (!ok) return NextResponse.json({ error: 'Workout not found.' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[workouts DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete workout.' }, { status: 500 })
  }
}
