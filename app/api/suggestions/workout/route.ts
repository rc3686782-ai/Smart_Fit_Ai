import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserIdFromSession, findUserById } from '@/lib/store'

export type WorkoutSuggestion = {
  id: string
  title: string
  goal: string
  durationMin: number
  intensity: 'Easy' | 'Moderate' | 'Hard'
  level: string
  caloriesBurn: string
  targetMuscles: string[]
  description: string
  bmiTip: string
  generalTips: string[]
  exercises: Array<{ name: string; setsReps: string; rest: string }>
  youtube: {
    id: string
    title: string
    channel: string
    url: string
    embedUrl: string
  }
}

const suggestionsDatabase: Record<string, WorkoutSuggestion[]> = {
  'Lose body fat': [
    {
      id: 'fatloss-hiit-1',
      title: '30-Min High-Burn Full Body HIIT',
      goal: 'Lose body fat',
      durationMin: 30,
      intensity: 'Hard',
      level: 'All Levels',
      caloriesBurn: '320 - 450 kcal',
      targetMuscles: ['Full Body', 'Cardiovascular', 'Core'],
      description: 'Metabolic conditioning circuit designed to maximize post-exercise oxygen consumption (EPOC), burning calories for hours after training.',
      bmiTip: 'Keep transitions brisk. If joint impact is an issue, swap jump squats for explosive air squats.',
      generalTips: [
        'Perform 40 seconds of maximum effort followed by 20 seconds of active recovery.',
        'Drink water in small sips during rest periods to prevent cramping.',
        'Focus on controlled breathing: inhale through the nose, exhale forcefully through the mouth.',
      ],
      exercises: [
        { name: 'Jumping Jacks / Step Jacks', setsReps: '3 sets x 45s', rest: '15s rest' },
        { name: 'Bodyweight Goblet Squats', setsReps: '4 sets x 15 reps', rest: '20s rest' },
        { name: 'Mountain Climbers', setsReps: '4 sets x 30s', rest: '20s rest' },
        { name: 'Burpees or Modified Incline Burpees', setsReps: '3 sets x 10 reps', rest: '30s rest' },
        { name: 'Plank Shoulder Taps', setsReps: '3 sets x 40s', rest: '20s rest' },
      ],
      youtube: {
        id: 'ml6cT4AZdqI',
        title: '30-Minute Full Body Fat Burning HIIT Workout (No Equipment)',
        channel: 'MadFit',
        url: 'https://www.youtube.com/watch?v=ml6cT4AZdqI',
        embedUrl: 'https://www.youtube.com/embed/ml6cT4AZdqI',
      },
    },
    {
      id: 'fatloss-lowimpact-2',
      title: 'Low-Impact Knee-Friendly Fat Burner',
      goal: 'Lose body fat',
      durationMin: 35,
      intensity: 'Moderate',
      level: 'Beginner to Intermediate',
      caloriesBurn: '250 - 360 kcal',
      targetMuscles: ['Glutes', 'Hamstrings', 'Upper Body', 'Abs'],
      description: 'Zero-jumping metabolic workout that burns fat and preserves joint integrity, making it safe and sustainable for any BMI.',
      bmiTip: 'Ideal for higher BMI ranges. Protects knee and ankle cartilage while maintaining steady-state fat oxidation.',
      generalTips: [
        'Engage your abdominal wall on every repetition to protect your lower back.',
        'Maintain a steady tempo rather than rushing through reps.',
        'Use a chair or wall for stability if balance feels challenged.',
      ],
      exercises: [
        { name: 'Low-Impact Speed Skater Steps', setsReps: '4 sets x 45s', rest: '20s rest' },
        { name: 'Glute Bridges with 2-sec Pause', setsReps: '4 sets x 15 reps', rest: '25s rest' },
        { name: 'Standing High Knee Cross Crunches', setsReps: '3 sets x 20 reps', rest: '20s rest' },
        { name: 'Shadow Boxing with Light Dumbbells', setsReps: '3 sets x 60s', rest: '30s rest' },
        { name: 'Bird Dog & Deadbugs', setsReps: '3 sets x 12 per side', rest: '20s rest' },
      ],
      youtube: {
        id: 'gC_L9qAHVJ8',
        title: '30 MIN LOW IMPACT HIIT WORKOUT - Joint-Friendly & Sweat Inducing',
        channel: 'growingannanas',
        url: 'https://www.youtube.com/watch?v=gC_L9qAHVJ8',
        embedUrl: 'https://www.youtube.com/embed/gC_L9qAHVJ8',
      },
    },
    {
      id: 'fatloss-dumbbells-3',
      title: 'Dumbbell Metabolic Strength & Tone',
      goal: 'Lose body fat',
      durationMin: 40,
      intensity: 'Hard',
      level: 'Intermediate',
      caloriesBurn: '360 - 500 kcal',
      targetMuscles: ['Shoulders', 'Legs', 'Back', 'Core'],
      description: 'Pairing compound resistance lifts with compound supersets prevents muscle loss while in a calorie deficit.',
      bmiTip: 'Resistance training is the #1 defense against metabolic slowdown during fat loss.',
      generalTips: [
        'Choose weights where the last 2 reps of each set feel challenging.',
        'Keep posture tall with shoulder blades pinned back and down.',
      ],
      exercises: [
        { name: 'Dumbbell Thrusters (Squat to Press)', setsReps: '4 sets x 12 reps', rest: '45s rest' },
        { name: 'Dumbbell Romanian Deadlifts', setsReps: '4 sets x 12 reps', rest: '45s rest' },
        { name: 'Bent-Over Dumbbell Rows', setsReps: '4 sets x 12 reps', rest: '30s rest' },
        { name: 'Push-ups (Knees or Toes)', setsReps: '3 sets x 10-15 reps', rest: '30s rest' },
      ],
      youtube: {
        id: 'UoC_O3Hz02c',
        title: '40 MIN COMPLETE FULL BODY WORKOUT with Dumbbells',
        channel: 'Juice & Toya',
        url: 'https://www.youtube.com/watch?v=UoC_O3Hz02c',
        embedUrl: 'https://www.youtube.com/embed/UoC_O3Hz02c',
      },
    },
  ],

  'Build muscle': [
    {
      id: 'muscle-push-1',
      title: 'Upper Body Hypertrophy (Chest, Shoulders, Triceps)',
      goal: 'Build muscle',
      durationMin: 45,
      intensity: 'Hard',
      level: 'Intermediate',
      caloriesBurn: '300 - 420 kcal',
      targetMuscles: ['Chest', 'Anterior Deltoids', 'Triceps'],
      description: 'High-tension mechanical overload designed to trigger myofibrillar muscle hypertrophy with targeted rep tempos.',
      bmiTip: 'Ensure a slight caloric surplus (+250 kcal) to fuel protein synthesis and muscular recovery.',
      generalTips: [
        'Apply progressive overload: add weight, reps, or slow down the eccentric tempo weekly.',
        'Rest 90-120 seconds between heavy compound sets to restore ATP levels.',
      ],
      exercises: [
        { name: 'Flat Dumbbell Bench Press', setsReps: '4 sets x 8-10 reps', rest: '90s rest' },
        { name: 'Overhead Dumbbell Shoulder Press', setsReps: '4 sets x 10-12 reps', rest: '75s rest' },
        { name: 'Incline Dumbbell Flyes', setsReps: '3 sets x 12 reps', rest: '60s rest' },
        { name: 'Lateral Raises with Controlled Drop', setsReps: '4 sets x 15 reps', rest: '45s rest' },
        { name: 'Triceps Overhead Extensions', setsReps: '3 sets x 12-15 reps', rest: '45s rest' },
      ],
      youtube: {
        id: 'U6yKYpXRv7w',
        title: 'Full Upper Body Workout for Muscle Growth (Step-by-Step Guide)',
        channel: 'Jeff Nippard',
        url: 'https://www.youtube.com/watch?v=U6yKYpXRv7w',
        embedUrl: 'https://www.youtube.com/embed/U6yKYpXRv7w',
      },
    },
    {
      id: 'muscle-pull-2',
      title: 'Back & Biceps Power Builder',
      goal: 'Build muscle',
      durationMin: 45,
      intensity: 'Hard',
      level: 'All Levels',
      caloriesBurn: '320 - 430 kcal',
      targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Biceps', 'Rear Delts'],
      description: 'Comprehensive pulling workout that builds width in the lats, upper back thickness, and bicep peaks.',
      bmiTip: 'Focus on mind-muscle connection. Squeeze your shoulder blades together at the peak contraction.',
      generalTips: [
        'Pull through your elbows rather than yanking with your hands to isolate the back.',
        'Keep core tight to eliminate momentum.',
      ],
      exercises: [
        { name: 'Single-Arm Dumbbell Rows', setsReps: '4 sets x 10 per arm', rest: '60s rest' },
        { name: 'Dumbbell Pullovers', setsReps: '3 sets x 12 reps', rest: '60s rest' },
        { name: 'Incline Dumbbell Bicep Curls', setsReps: '4 sets x 12 reps', rest: '45s rest' },
        { name: 'Hammer Curls for Forearms & Brachialis', setsReps: '3 sets x 12 reps', rest: '45s rest' },
      ],
      youtube: {
        id: 'Q6kVkVHzLw0',
        title: 'The Most Effective Pull Workout for Muscle Growth',
        channel: 'Jeremy Ethier',
        url: 'https://www.youtube.com/watch?v=Q6kVkVHzLw0',
        embedUrl: 'https://www.youtube.com/embed/Q6kVkVHzLw0',
      },
    },
  ],

  'Improve endurance': [
    {
      id: 'endurance-stamina-1',
      title: 'Aerobic Base & Stamina Interval Run',
      goal: 'Improve endurance',
      durationMin: 40,
      intensity: 'Moderate',
      level: 'All Levels',
      caloriesBurn: '380 - 520 kcal',
      targetMuscles: ['Cardiovascular', 'Quads', 'Calves', 'Core'],
      description: 'Lactate threshold intervals built to expand VO2 max, improve aerobic endurance, and optimize cardiovascular health.',
      bmiTip: 'Stay in Zone 2-3 (comfortable to conversational pace) for 80% of the session.',
      generalTips: [
        'Cadence target: ~165-175 steps per minute to reduce ground contact impact.',
        'Stay upright with slight forward lean from the ankles, not the hips.',
      ],
      exercises: [
        { name: 'Dynamic Warmup & Leg Swings', setsReps: '5 minutes', rest: 'Continuous' },
        { name: 'Zone 2 Aerobic Running', setsReps: '20 minutes steady', rest: '2m walk' },
        { name: 'Tempo Strides', setsReps: '6 intervals x 30s fast', rest: '60s walk' },
        { name: 'Cool Down Walking & Mobility', setsReps: '5 minutes', rest: 'Done' },
      ],
      youtube: {
        id: 'vt4lcXOuO6c',
        title: 'How to Build Endless Running Stamina (Zone 2 Guide)',
        channel: 'The Run Experience',
        url: 'https://www.youtube.com/watch?v=vt4lcXOuO6c',
        embedUrl: 'https://www.youtube.com/embed/vt4lcXOuO6c',
      },
    },
  ],

  'Stay healthy': [
    {
      id: 'healthy-functional-1',
      title: 'Daily Functional Mobility & Core Activation',
      goal: 'Stay healthy',
      durationMin: 25,
      intensity: 'Easy',
      level: 'Beginner',
      caloriesBurn: '140 - 210 kcal',
      targetMuscles: ['Thoracic Spine', 'Hip Flexors', 'Deep Core', 'Glutes'],
      description: 'Restores posture, relieves desk stiffness, lubricates joint capsules, and activates stabilizing muscles.',
      bmiTip: 'Excellent recovery session to lower cortisol and maintain daily metabolic consistency.',
      generalTips: [
        'Breathe deep into your diaphragm during every stretch.',
        'Never force a range of motion that causes sharp pain.',
      ],
      exercises: [
        { name: 'Cat-Cow Spinal Waves', setsReps: '2 sets x 10 cycles', rest: '15s rest' },
        { name: 'Worlds Greatest Stretch', setsReps: '3 sets x 5 per side', rest: '20s rest' },
        { name: 'Glute Bridge Holds with Diaphragmatic Breath', setsReps: '3 sets x 30s', rest: '20s rest' },
        { name: 'Deadbug Spinal Neutral Holds', setsReps: '3 sets x 10 per side', rest: '20s rest' },
      ],
      youtube: {
        id: '3W5vBJ_5Ojg',
        title: '20 Minute Full Body Daily Mobility Routine for Longevity',
        channel: 'Tom Merrick',
        url: 'https://www.youtube.com/watch?v=3W5vBJ_5Ojg',
        embedUrl: 'https://www.youtube.com/embed/3W5vBJ_5Ojg',
      },
    },
  ],
}

// Fallback mapping for flexible goal matching
function getCategoryForGoal(goal: string): string {
  const g = goal.toLowerCase()
  if (g.includes('fat') || g.includes('lose') || g.includes('weight')) return 'Lose body fat'
  if (g.includes('muscle') || g.includes('hypertrophy') || g.includes('strength')) return 'Build muscle'
  if (g.includes('endurance') || g.includes('run') || g.includes('cycle') || g.includes('stamina')) return 'Improve endurance'
  return 'Stay healthy'
}

function calculateBMI(weight: number, height: number, unit: string) {
  let weightKg = weight > 0 ? weight : 70
  let heightCm = height > 0 ? height : 170

  if (unit === 'imperial') {
    weightKg = weightKg * 0.45359237
    heightCm = heightCm * 2.54
  }

  const heightM = heightCm / 100
  const bmiRaw = weightKg / (heightM * heightM)
  const bmi = Math.round(bmiRaw * 10) / 10

  let category = 'Normal weight'
  let color = '#d6f36b'
  let summary = 'Healthy body composition'
  let advice = 'Great foundation for progressive strength, endurance, and body conditioning.'

  if (bmi < 18.5) {
    category = 'Underweight'
    color = '#70d6ff'
    summary = 'Below optimal body mass'
    advice = 'Focus on nutrient-dense calorie surplus and progressive resistance training to build healthy lean muscle.'
  } else if (bmi >= 18.5 && bmi <= 24.9) {
    category = 'Normal weight'
    color = '#d6f36b'
    summary = 'Optimal BMI range'
    advice = 'Your body mass is in a balanced metabolic zone. Ideal for high-intensity circuits, toning, and athletic stamina.'
  } else if (bmi >= 25.0 && bmi <= 29.9) {
    category = 'Overweight'
    color = '#ffd166'
    summary = 'Slightly above optimal weight'
    advice = 'Target steady fat loss with high-burn cardio, metabolic conditioning, and joint-friendly exercises.'
  } else {
    category = 'Obese'
    color = '#ef476f'
    summary = 'Elevated body mass index'
    advice = 'Prioritize low-impact joint-friendly training (walking, cycling, swimming, bodyweight) combined with a controlled calorie deficit.'
  }

  // Healthy weight range (BMI 18.5 - 24.9)
  const minHealthyKg = Math.round(18.5 * heightM * heightM)
  const maxHealthyKg = Math.round(24.9 * heightM * heightM)

  let healthyRange = `${minHealthyKg} - ${maxHealthyKg} kg`
  if (unit === 'imperial') {
    const minLbs = Math.round(minHealthyKg * 2.20462)
    const maxLbs = Math.round(maxHealthyKg * 2.20462)
    healthyRange = `${minLbs} - ${maxLbs} lbs`
  }

  return {
    value: bmi,
    category,
    color,
    summary,
    advice,
    healthyRange,
    weightKg: Math.round(weightKg),
    heightCm: Math.round(heightCm),
  }
}

async function getUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sf_session')?.value
  if (!sessionId) return null
  const userId = getUserIdFromSession(sessionId)
  if (!userId) return null
  return findUserById(userId) ?? null
}

export async function GET(request: Request) {
  try {
    const user = await getUser()
    const profile = user?.profile ?? {}
    const { searchParams } = new URL(request.url)
    const requestedGoal = searchParams.get('goal') || profile.goal || 'Lose body fat'

    const weight = Number(profile.weight) || 70
    const height = Number(profile.height) || 170
    const unit = profile.unit || 'metric'

    const bmiInfo = calculateBMI(weight, height, unit)
    const categoryKey = getCategoryForGoal(requestedGoal)
    const suggestions = suggestionsDatabase[categoryKey] || suggestionsDatabase['Lose body fat']

    return NextResponse.json({
      bmi: bmiInfo,
      currentGoal: requestedGoal,
      categoryKey,
      availableGoals: ['Lose body fat', 'Build muscle', 'Improve endurance', 'Stay healthy'],
      suggestions,
    })
  } catch (error) {
    console.error('[suggestions/workout GET]', error)
    return NextResponse.json({ error: 'Failed to generate suggestions.' }, { status: 500 })
  }
}
