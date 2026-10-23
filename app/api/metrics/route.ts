import { NextResponse } from 'next/server'
import { getUserIdFromSession, findUserById } from '@/lib/store'
import { cookies } from 'next/headers'

/* ─── Profile → personalized targets ────────────────────────────────────── */

function weeklySessionTarget(activity: string | undefined): number {
  switch (activity) {
    case 'Just starting':            return 1
    case '1–2 sessions / week':      return 2
    case '3–4 sessions / week':      return 4
    case '5+ sessions / week':       return 5
    default:                         return 3
  }
}

function activeMinutesTarget(activity: string | undefined): number {
  switch (activity) {
    case 'Just starting':            return 30
    case '1–2 sessions / week':      return 45
    case '3–4 sessions / week':      return 60
    case '5+ sessions / week':       return 90
    default:                         return 60
  }
}

function calorieGoal(
  goal: string | undefined,
  weight: string | undefined,
  unit: string | undefined,
  activity: string | undefined,
): number {
  // Estimate maintenance calories using weight (rough 30 kcal/kg)
  let weightKg = weight ? parseFloat(weight) : 70
  if (unit === 'imperial') weightKg = weightKg * 0.453592

  let base = Math.round(weightKg * 30)

  // Adjust for goal
  switch (goal) {
    case 'Lose body fat':   base = Math.round(base * 0.85); break
    case 'Build muscle':
    case 'Build strength':  base = Math.round(base * 1.1);  break
    case 'Improve endurance': base = Math.round(base * 1.05); break
    default: break
  }

  // Adjust for activity
  switch (activity) {
    case 'Just starting':          base = Math.round(base * 0.9);  break
    case '5+ sessions / week':     base = Math.round(base * 1.15); break
    default: break
  }

  return Math.max(1400, Math.min(base, 4000))
}

function macroGoals(goal: string | undefined, calGoal: number) {
  switch (goal) {
    case 'Build strength':
    case 'Build muscle':
      return {
        protein: Math.round(calGoal * 0.30 / 4),  // 30% protein
        carbs:   Math.round(calGoal * 0.45 / 4),  // 45% carbs
        fat:     Math.round(calGoal * 0.25 / 9),  // 25% fat
      }
    case 'Lose body fat':
      return {
        protein: Math.round(calGoal * 0.35 / 4),
        carbs:   Math.round(calGoal * 0.35 / 4),
        fat:     Math.round(calGoal * 0.30 / 9),
      }
    case 'Improve endurance':
      return {
        protein: Math.round(calGoal * 0.20 / 4),
        carbs:   Math.round(calGoal * 0.55 / 4),
        fat:     Math.round(calGoal * 0.25 / 9),
      }
    default: // Stay healthy, balanced
      return {
        protein: Math.round(calGoal * 0.25 / 4),
        carbs:   Math.round(calGoal * 0.50 / 4),
        fat:     Math.round(calGoal * 0.25 / 9),
      }
  }
}

function readinessScore(activity: string | undefined): number {
  // More active users have higher baseline readiness (they're more conditioned)
  switch (activity) {
    case 'Just starting':        return 72
    case '1–2 sessions / week':  return 80
    case '3–4 sessions / week':  return 86
    case '5+ sessions / week':   return 90
    default:                     return 82
  }
}

/* ─── Route ──────────────────────────────────────────────────────────────── */

export async function GET() {
  const now   = new Date()
  const hour  = now.getHours()

  // Try to get logged-in user's profile
  let profile: {
    goal?: string; activity?: string; training?: string; diet?: string
    weight?: string; height?: string; unit?: string; dob?: string; sex?: string
  } | undefined

  try {
    const cookieStore = await cookies()
    const sessionId   = cookieStore.get('sf_session')?.value
    if (sessionId) {
      const userId = getUserIdFromSession(sessionId)
      if (userId) {
        const user = findUserById(userId)
        profile = user?.profile
      }
    }
  } catch { /* cookies() can throw outside request context */ }

  // ── Personalised targets from profile ─────────────────────────────────
  const sessionsPerWeek = weeklySessionTarget(profile?.activity)
  const activeMinGoal   = activeMinutesTarget(profile?.activity)
  const calGoal         = calorieGoal(profile?.goal, profile?.weight, profile?.unit, profile?.activity)
  const macros          = macroGoals(profile?.goal, calGoal)
  const readiness       = readinessScore(profile?.activity)

  // ── BMI calculation ───────────────────────────────────────────────────
  let weightKg = profile?.weight ? parseFloat(profile.weight) : 70
  let heightCm = profile?.height ? parseFloat(profile.height) : 172
  if (profile?.unit === 'imperial') {
    weightKg = weightKg * 0.45359237
    heightCm = heightCm * 2.54
  }
  const heightM = heightCm / 100
  const bmiValue = Math.round((weightKg / (heightM * heightM)) * 10) / 10
  let bmiCategory = 'Normal weight'
  let bmiColor = '#d6f36b'
  if (bmiValue < 18.5) {
    bmiCategory = 'Underweight'
    bmiColor = '#70d6ff'
  } else if (bmiValue >= 25 && bmiValue < 30) {
    bmiCategory = 'Overweight'
    bmiColor = '#ffd166'
  } else if (bmiValue >= 30) {
    bmiCategory = 'Obese'
    bmiColor = '#ef476f'
  }
  const minHealthyKg = Math.round(18.5 * heightM * heightM)
  const maxHealthyKg = Math.round(24.9 * heightM * heightM)

  // ── Simulate "current" progress through the day ───────────────────────
  const dayProgress       = hour / 24
  const caloriesBurned    = Math.round(calGoal * 0.4 * dayProgress + calGoal * 0.35 + Math.random() * 30)
  const caloriesConsumed  = Math.round(caloriesBurned * 0.68 + Math.random() * 50)
  const activeMin         = Math.round(activeMinGoal * dayProgress + Math.random() * 5)

  // Macro progress (proportional to calorie progress)
  const consumedRatio = Math.min(caloriesConsumed / calGoal, 0.95)
  const proteinCurrent = Math.round(macros.protein * consumedRatio)
  const carbsCurrent   = Math.round(macros.carbs   * consumedRatio)
  const fatCurrent     = Math.round(macros.fat     * consumedRatio)

  // HRV / RHR vary slightly by activity level
  const baseHRV = profile?.activity === '5+ sessions / week' ? 70 : profile?.activity === '3–4 sessions / week' ? 64 : 58
  const baseRHR = profile?.activity === '5+ sessions / week' ? 52 : profile?.activity === '3–4 sessions / week' ? 58 : 64

  return NextResponse.json({
    // User's profile context (so the frontend can display it)
    userGoal:       profile?.goal     ?? null,
    userActivity:   profile?.activity ?? null,
    userTraining:   profile?.training ?? null,

    // Personalised targets
    weeklySessionsTarget: sessionsPerWeek,

    // Body Mass Index
    bmi: {
      value:        bmiValue,
      category:     bmiCategory,
      color:        bmiColor,
      weightKg:     Math.round(weightKg),
      heightCm:     Math.round(heightCm),
      healthyRange: `${minHealthyKg} - ${maxHealthyKg} kg`,
    },

    // Health scores
    readiness,
    hrv:       baseHRV + Math.round(Math.random() * 4 - 2),
    restingHR: baseRHR + Math.round(Math.random() * 4 - 2),
    sleep: { hours: 7, minutes: 42, score: 82 },

    // Calorie data
    calories: {
      burned:   caloriesBurned,
      consumed: caloriesConsumed,
      goal:     calGoal,
    },

    // Activity
    activeMinutes: { current: activeMin, goal: activeMinGoal },

    // Macros
    macros: {
      protein: { current: proteinCurrent, goal: macros.protein },
      carbs:   { current: carbsCurrent,   goal: macros.carbs   },
      fat:     { current: fatCurrent,     goal: macros.fat     },
    },

    heartRateTrend: [
      baseRHR - 6, baseRHR, baseRHR - 3, baseRHR + 3,
      baseRHR, baseRHR + 5, baseRHR,
    ],

    updatedAt: now.toISOString(),
  })
}
