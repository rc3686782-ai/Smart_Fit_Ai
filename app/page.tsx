'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CoachChat } from '@/components/coach-chat'
import {
  Activity, Apple, ArrowDown, ArrowUp, Bell, ChevronRight, Check,
  Droplet, Droplets, Dumbbell, ExternalLink, Flame, HeartPulse,
  Home, Info, Lightbulb, Loader2, LogOut, Moon, MoreHorizontal,
  Play, Plus, RefreshCw, Scale, Settings, ShieldCheck, Sparkles,
  Target, TrendingUp, UserRound, Video, Watch, Waves, Zap,
} from 'lucide-react'

type View = 'Home' | 'Workouts' | 'Nutrition' | 'Profile'

const navItems: { label: View; icon: typeof Home }[] = [
  { label: 'Home', icon: Home },
  { label: 'Workouts', icon: Dumbbell },
  { label: 'Nutrition', icon: Apple },
  { label: 'Profile', icon: UserRound },
]

/* ─── Animated Ring ──────────────────────────────────────────────────────── */
function Ring({ value, color = '#d6f36b', size = 132 }: { value: number; color?: string; size?: number }) {
  const [animated, setAnimated] = useState(0)
  const radius = 45
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(value), 120)
    return () => clearTimeout(timeout)
  }, [value])

  const offset = circumference - (animated / 100) * circumference

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110" aria-label={`${value}% complete`} role="img">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
        <circle
          cx="55" cy="55" r={radius} fill="none" stroke={color}
          strokeLinecap="round" strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tracking-tight text-white">{value}%</span>
        <span className="text-[10px] uppercase tracking-[.14em] text-white/40">today</span>
      </div>
    </div>
  )
}

/* ─── Animated Macro Bar ─────────────────────────────────────────────────── */
function Macro({ label, value, target, percent, color }: {
  label: string; value: string; target: string; percent: number; color: string
}) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 300)
    return () => clearTimeout(t)
  }, [percent])

  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-white/55">{label}</span>
        <span className="text-white/35">{value} <span className="text-white/20">/ {target}</span></span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, backgroundColor: color, transition: 'width 1s cubic-bezier(.4,0,.2,1)' }}
        />
      </div>
    </div>
  )
}

/* ─── Metric Card ────────────────────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, unit, detail, accent, delay = 0 }: {
  icon: typeof Activity; label: string; value: string; unit: string; detail: string; accent: string; delay?: number
}) {
  return (
    <div className="metric-card card-enter" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <div className="icon-tile" style={{ color: accent }}><Icon size={17} /></div>
        <MoreHorizontal size={16} className="text-white/25" />
      </div>
      <p className="mt-5 text-xs uppercase tracking-[.14em] text-white/40">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-[27px] font-semibold tracking-tight text-white">{value}</span>
        <span className="text-xs text-white/40">{unit}</span>
      </div>
      <p className="mt-2 text-[11px] text-white/40">{detail}</p>
    </div>
  )
}

/* ─── Bar Chart ──────────────────────────────────────────────────────────── */
function BarChart({ data, days }: { data: number[]; days: string[] }) {
  const [heights, setHeights] = useState(data.map(() => 0))
  useEffect(() => {
    const t = setTimeout(() => setHeights(data), 200)
    return () => clearTimeout(t)
  }, [data])
  return (
    <div className="mt-5 flex items-end gap-1.5" aria-label="Resting heart rate trend chart">
      {data.map((target, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-20 w-full items-end">
            <div
              className={`w-full rounded-t-sm ${index === data.length - 1 ? 'bg-[#d6f36b]' : 'bg-white/15'}`}
              style={{ height: `${heights[index]}%`, transition: `height .7s ${index * 0.08}s cubic-bezier(.4,0,.2,1)` }}
            />
          </div>
          <span className="text-[10px] text-white/25">{days[index]}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Metrics type ───────────────────────────────────────────────────────── */
type Metrics = {
  readiness: number; hrv: number; restingHR: number
  sleep: { hours: number; minutes: number; score: number }
  calories: { burned: number; consumed: number; goal: number }
  activeMinutes: { current: number; goal: number }
  macros: { protein: { current: number; goal: number }; carbs: { current: number; goal: number }; fat: { current: number; goal: number } }
  heartRateTrend: number[]
  bmi?: {
    value: number
    category: string
    color: string
    weightKg: number
    heightCm: number
    healthyRange: string
  }
  // Personalised from user profile
  userGoal: string | null
  userActivity: string | null
  userTraining: string | null
  weeklySessionsTarget: number
}

/* ─── Home View ──────────────────────────────────────────────────────────── */
function HomeView({ metrics, firstName }: { metrics: Metrics | null; firstName: string }) {
  const m = metrics

  const sleepLabel       = m ? `${m.sleep.hours}h ${m.sleep.minutes}m` : '7h 42m'
  const caloriesBurned   = m ? m.calories.burned : 1842
  const caloriesConsumed = m ? m.calories.consumed : 1362
  const caloriesGoal     = m ? m.calories.goal : 2000
  const caloriesRemaining = Math.max(0, caloriesGoal - caloriesConsumed)
  const activeMin        = m ? m.activeMinutes.current : 42
  const activeGoal       = m ? m.activeMinutes.goal : 70
  const activeRem        = Math.max(0, activeGoal - activeMin)
  const readiness        = m?.readiness ?? 86
  const hrv              = m?.hrv ?? 64
  const rhr              = m?.restingHR ?? 58
  const protein          = m?.macros.protein ?? { current: 112, goal: 140 }
  const carbs            = m?.macros.carbs ?? { current: 148, goal: 210 }
  const fat              = m?.macros.fat ?? { current: 42, goal: 65 }
  const trend            = m?.heartRateTrend ?? [52, 58, 55, 61, 58, 63, 58]
  const macroPercent     = Math.round((caloriesConsumed / caloriesGoal) * 100)
  const calBurnedPct     = Math.round((caloriesBurned / caloriesGoal) * 100)

  // Personalised from profile
  const userGoal     = m?.userGoal ?? null
  const userActivity = m?.userActivity ?? null
  const userTraining = m?.userTraining ?? null
  const sessionsTarget = m?.weeklySessionsTarget ?? 3

  // Derive workout label from training preference
  const workoutLabel = userTraining === 'Running' ? 'Easy run'
    : userTraining === 'Cycling' ? 'Endurance ride'
    : userTraining === 'Strength training' ? 'Upper body strength'
    : userTraining === 'Mixed training' ? 'Full body circuit'
    : userTraining === 'Sports performance' ? 'Speed & agility'
    : 'Upper body strength'

  const workoutDetail = userTraining === 'Running' ? '5 km · Easy pace'
    : userTraining === 'Cycling' ? '30 km · Zone 2'
    : userTraining === 'Sports performance' ? '50 min · High intensity'
    : '45 min · Moderate'

  // Personalised coach note
  const coachNote = userGoal === 'Lose body fat'
    ? `You're ${caloriesRemaining.toLocaleString()} kcal under your goal — great deficit today. Keep protein above ${protein.goal}g to preserve muscle.`
    : userGoal === 'Build muscle' || userGoal === 'Build strength'
    ? `HRV is up and RHR is down. A perfect window for a heavy session. Aim for ${protein.goal}g protein today to support recovery.`
    : userGoal === 'Improve endurance'
    ? `Your aerobic base looks solid. ${activeRem > 0 ? `${activeRem} more active minutes` : 'You hit your active minutes goal!'} to reach today's target.`
    : `Your recovery is trending up — a great day for movement. ${sessionsTarget > 2 ? 'Push hard today.' : 'Keep it consistent this week.'}`

  // Readiness label
  const readinessLabel = readiness >= 85 ? "You're in the green" : readiness >= 70 ? 'Good to train' : 'Take it easy today'
  const readinessNote  = readiness >= 85
    ? 'Your recovery is trending up. A high-intensity session is on the table today.'
    : readiness >= 70
    ? 'Moderate training recommended. Avoid going all-out today.'
    : 'Consider a light recovery session or rest day today.'

  const today   = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const hour    = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      {/* Header */}
      <header className="mb-8 flex items-start justify-between card-enter" style={{ animationDelay: '0ms' }}>
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-white sm:text-[34px]">
            {greeting}, {firstName}<span className="text-[#d6f36b]">.</span>
          </h1>
          {userGoal && (
            <p className="mt-1 text-xs text-[#d6f36b]/70 uppercase tracking-widest font-medium">
              Goal: {userGoal} · {sessionsTarget}×/week
            </p>
          )}
          <p className="mt-1.5 text-sm text-white/40">
            {userActivity ? `Training ${userActivity.toLowerCase()}.` : 'Your body is ready for a strong day.'}
          </p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="sync-pill"><span className="pulse-dot" /> Live <span className="text-white/30">·</span> personalised</div>
          <button className="avatar" aria-label="Open profile">{firstName ? firstName[0].toUpperCase() : '?'}</button>
        </div>
      </header>

      {/* Body Mass Index (BMI) & Composition Assessment */}
      {m?.bmi && (
        <section className="mb-5 dark-card card-enter border border-white/10" style={{ animationDelay: '40ms' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl border text-center shadow-lg"
                style={{
                  borderColor: `${m.bmi.color}40`,
                  background: `radial-gradient(circle, ${m.bmi.color}25 0%, transparent 80%)`,
                }}
              >
                <span className="text-xl font-bold tracking-tight text-white">{m.bmi.value}</span>
                <span className="text-[9px] uppercase font-semibold text-white/40">BMI</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">Body Mass Index (BMI)</h3>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${m.bmi.color}20`,
                      color: m.bmi.color,
                      border: `1px solid ${m.bmi.color}40`,
                    }}
                  >
                    {m.bmi.category}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-white/45">
                  Healthy weight range: <span className="text-white/70 font-medium">{m.bmi.healthyRange}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-white/40">Weight</p>
                <p className="text-sm font-semibold text-white">{m.bmi.weightKg} kg</p>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-white/40">Height</p>
                <p className="text-sm font-semibold text-white">{m.bmi.heightCm} cm</p>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-white/40">Classification</p>
                <p className="text-sm font-semibold" style={{ color: m.bmi.color }}>{m.bmi.category}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Readiness + Sleep */}
      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="feature-card md:col-span-2 card-enter" style={{ animationDelay: '80ms' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow text-[#d6f36b]/70">Daily readiness</p>
              <h2 className="mt-2 text-xl font-medium text-white">{readinessLabel}</h2>
              <p className="mt-1 max-w-[250px] text-xs leading-5 text-white/40">{readinessNote}</p>
            </div>
            <Ring value={readiness} />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-[#d6f36b]">
            <TrendingUp size={14} /> 8% above your 7-day average
          </div>
        </div>
        <div className="dark-card flex flex-col justify-between card-enter" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center justify-between">
            <div className="icon-tile text-[#f5a97f]"><Moon size={17} /></div>
            <span className="status-label">On track</span>
          </div>
          <div>
            <p className="eyebrow mt-6">Sleep score</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-white">{sleepLabel}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#f5a97f]"
                style={{ width: `${m?.sleep.score ?? 82}%`, transition: 'width 1s .5s ease' }} />
            </div>
            <p className="mt-2 text-[11px] text-white/40">{m?.sleep.score ?? 82}% of your sleep target</p>
          </div>
        </div>
      </section>

      {/* Metric cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={HeartPulse} label="Resting heart rate" value={String(rhr)} unit="bpm" detail="↓ 3 bpm from average" accent="#f5a97f" delay={0} />
        <MetricCard icon={Zap} label="HRV" value={String(hrv)} unit="ms" detail="↑ 12% from average" accent="#d6f36b" delay={80} />
        <MetricCard icon={Flame} label="Calories burned" value={caloriesBurned.toLocaleString()} unit="kcal" detail={`${calBurnedPct}% of ${caloriesGoal.toLocaleString()} kcal goal`} accent="#f4c96b" delay={160} />
        <MetricCard icon={Waves} label="Active minutes" value={String(activeMin)} unit="min" detail={activeRem > 0 ? `${activeRem} min to reach ${activeGoal} min goal` : '✓ Goal reached!'} accent="#a6d8e8" delay={240} />
      </div>

      {/* Calories + Coach note */}
      <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <div className="dark-card card-enter" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Energy balance</p>
              <h2 className="mt-1 text-lg font-medium text-white">Calories &amp; macros</h2>
            </div>
            <span className="text-xs text-white/35">Goal: {caloriesGoal.toLocaleString()} kcal</span>
          </div>
          <div className="mt-7 flex items-center gap-7">
            <Ring value={Math.min(macroPercent, 100)} size={118} color="#f4c96b" />
            <div className="min-w-0 flex-1">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/40">Consumed</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{caloriesConsumed.toLocaleString()} <span className="text-xs font-normal text-white/35">kcal</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">Remaining</p>
                  <p className="mt-1 text-2xl font-semibold text-[#d6f36b]">{caloriesRemaining.toLocaleString()} <span className="text-xs font-normal text-white/35">kcal</span></p>
                </div>
              </div>
              <div className="space-y-3">
                <Macro label="Protein" value={`${protein.current}g`} target={`${protein.goal}g`} percent={Math.min(Math.round((protein.current / protein.goal) * 100), 100)} color="#d6f36b" />
                <Macro label="Carbs"   value={`${carbs.current}g`}   target={`${carbs.goal}g`}   percent={Math.min(Math.round((carbs.current / carbs.goal) * 100), 100)}   color="#a6d8e8" />
                <Macro label="Fat"     value={`${fat.current}g`}     target={`${fat.goal}g`}     percent={Math.min(Math.round((fat.current / fat.goal) * 100), 100)}     color="#f5a97f" />
              </div>
            </div>
          </div>
        </div>

        <div className="dark-card card-enter" style={{ animationDelay: '280ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Coach&apos;s note</p>
              <h2 className="mt-1 text-lg font-medium text-white">One thing to know</h2>
            </div>
            <div className="icon-tile text-[#d6f36b]"><Lightbulb size={17} /></div>
          </div>
          <p className="mt-6 text-sm leading-6 text-white/60">{coachNote}</p>
          <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4">
            <span className="text-xs text-white/35">Based on your profile</span>
            <button className="text-xs text-[#d6f36b]">Ask coach <ChevronRight className="inline" size={13} /></button>
          </div>
        </div>
      </section>

      {/* Workout + Weekly sessions + HR trend */}
      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Next workout */}
        <div className="dark-card card-enter" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Next up</p>
              <h2 className="mt-1 text-lg font-medium text-white">{workoutLabel}</h2>
            </div>
            <span className="rounded-full bg-[#d6f36b]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#d6f36b]">Today</span>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/5 text-white/60"><Dumbbell size={21} /></div>
            <div>
              <p className="text-sm text-white/75">{userTraining ?? 'Strength training'}</p>
              <p className="mt-1 text-xs text-white/35">{workoutDetail}</p>
            </div>
            <button className="ml-auto flex size-10 items-center justify-center rounded-full bg-[#d6f36b] text-[#12150f] hover:scale-110 transition-transform" aria-label="Start workout">
              <Play size={16} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Weekly sessions progress */}
        <div className="dark-card card-enter" style={{ animationDelay: '360ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Weekly plan</p>
              <h2 className="mt-1 text-lg font-medium text-white">Sessions this week</h2>
            </div>
            <span className="text-xs text-white/35">Target: {sessionsTarget}×</span>
          </div>
          <div className="mt-6 flex items-end gap-2">
            {Array.from({ length: sessionsTarget }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-full rounded-lg ${i < Math.min(2, sessionsTarget) ? 'bg-[#d6f36b]' : 'bg-white/10'}`}
                  style={{ height: 40, transition: `height .5s ${i * 0.1}s ease` }} />
                <span className="text-[10px] text-white/30">{['M','T','W','T','F','S','S'][i] ?? i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/40">
            {Math.min(2, sessionsTarget)} of {sessionsTarget} sessions completed
          </p>
        </div>

        {/* HR Trend */}
        <div className="dark-card card-enter" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Pulse trend</p>
              <h2 className="mt-1 text-lg font-medium text-white">Resting heart rate</h2>
            </div>
            <span className="text-xs text-white/35">Last 7 days</span>
          </div>
          <BarChart data={trend} days={['W', 'T', 'F', 'S', 'S', 'M', 'T']} />
        </div>
      </section>
    </>
  )
}


/* ─── Secondary Views ────────────────────────────────────────────────────── */
function SecondaryView({
  view, user, onLogout,
}: {
  view: Exclude<View, 'Home'>
  user: { name: string; email: string } | null
  onLogout: () => void
}) {
  if (view === 'Workouts') return <WorkoutsView />
  if (view === 'Nutrition') return <NutritionView />
  return <ProfileView user={user} onLogout={onLogout} />
}

/* ─── Workouts View ──────────────────────────────────────────────────────── */
function WorkoutsView() {
  const [workouts, setWorkouts] = useState<Array<{id:string;name:string;type:string;durationMin:number;intensity:string;date:string;completed:boolean;notes?:string}>>([])
  const [loadingWorkouts, setLoadingWorkouts] = useState(true)
  const [logging, setLogging] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', durationMin: '45', intensity: 'Moderate', notes: '' })

  // Advanced SmartFit Suggestions & BMI state
  const [activeGoal, setActiveGoal] = useState<string>('Lose body fat')
  const [bmiData, setBmiData] = useState<{
    value: number
    category: string
    color: string
    summary: string
    advice: string
    healthyRange: string
    weightKg: number
    heightCm: number
  } | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [loggedWorkoutIds, setLoggedWorkoutIds] = useState<Record<string, boolean>>({})

  // Fetch logged workouts history
  useEffect(() => {
    fetch('/api/workouts')
      .then(r => r.json())
      .then(d => {
        if (d.workouts) setWorkouts(d.workouts)
      })
      .finally(() => setLoadingWorkouts(false))
  }, [])

  // Fetch BMI and workout suggestions based on activeGoal
  useEffect(() => {
    setLoadingSuggestions(true)
    fetch(`/api/suggestions/workout?goal=${encodeURIComponent(activeGoal)}`)
      .then(r => r.json())
      .then(d => {
        if (d.bmi) setBmiData(d.bmi)
        if (d.suggestions) setSuggestions(d.suggestions)
      })
      .catch(console.error)
      .finally(() => setLoadingSuggestions(false))
  }, [activeGoal])

  async function logWorkout() {
    if (!form.name.trim() || !form.durationMin) return
    setLogging(true)
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, durationMin: Number(form.durationMin) }),
    })
    if (res.ok) {
      const { workout } = await res.json()
      setWorkouts(prev => [workout, ...prev])
      setForm({ name: '', durationMin: '45', intensity: 'Moderate', notes: '' })
      setShowForm(false)
    }
    setLogging(false)
  }

  async function logRecommendedWorkout(w: any) {
    setLoggedWorkoutIds(prev => ({ ...prev, [w.id]: true }))
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: w.title,
          durationMin: w.durationMin,
          intensity: w.intensity,
          notes: `Target: ${w.targetMuscles.join(', ')}. Calorie burn: ${w.caloriesBurn}. Completed recommended routine.`,
        }),
      })
      if (res.ok) {
        const { workout } = await res.json()
        setWorkouts(prev => [workout, ...prev])
        setTimeout(() => {
          setLoggedWorkoutIds(prev => ({ ...prev, [w.id]: false }))
        }, 4000)
      }
    } catch {
      setLoggedWorkoutIds(prev => ({ ...prev, [w.id]: false }))
    }
  }

  async function removeWorkout(id: string) {
    await fetch(`/api/workouts?id=${id}`, { method: 'DELETE' })
    setWorkouts(prev => prev.filter(w => w.id !== id))
  }

  const thisWeek = workouts.filter(w => {
    const d = new Date(w.date)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 86400000
    return diff <= 7
  }).length

  const goalOptions = [
    { label: '🔥 Lose body fat', value: 'Lose body fat' },
    { label: '💪 Build muscle', value: 'Build muscle' },
    { label: '⚡ Improve endurance', value: 'Improve endurance' },
    { label: '🌱 Stay healthy', value: 'Stay healthy' },
  ]

  return (
    <>
      <header className="mb-6 card-enter">
        <p className="eyebrow">SmartFit AI Coaching</p>
        <div className="mt-2 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="icon-tile text-[#d6f36b]"><Dumbbell size={19} /></div>
            <h1 className="text-3xl font-semibold tracking-[-.04em] text-white">Smart Workout Plan</h1>
          </div>
          {/* Goal Selector Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 flex-wrap">
            {goalOptions.map(g => (
              <button
                key={g.value}
                onClick={() => setActiveGoal(g.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeGoal === g.value
                    ? 'bg-[#d6f36b] text-black shadow-sm font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-white/40">
          Personalized workout suggestions, BMI assessment, form videos, and recovery tips for <span className="text-[#d6f36b] font-medium">{activeGoal}</span>.
        </p>
      </header>

      {/* ─── 1. BMI & Physical Assessment Card ────────────────────────────── */}
      <div className="dark-card mb-6 card-enter border border-white/10" style={{ animationDelay: '60ms' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl border text-center shadow-lg"
              style={{
                borderColor: bmiData?.color ? `${bmiData.color}40` : 'rgba(214,243,107,0.3)',
                background: bmiData?.color ? `radial-gradient(circle, ${bmiData.color}20 0%, transparent 80%)` : 'rgba(214,243,107,0.1)',
              }}
            >
              <span className="text-2xl font-bold tracking-tight text-white">{bmiData ? bmiData.value : '--'}</span>
              <span className="text-[10px] uppercase font-semibold text-white/40">BMI</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Your Body Mass Index (BMI)</h2>
                {bmiData && (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${bmiData.color}25`,
                      color: bmiData.color,
                      border: `1px solid ${bmiData.color}40`,
                    }}
                  >
                    {bmiData.category}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-white/50">{bmiData?.summary || 'Calculated from your body measurements'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-white/40">Current Weight</p>
              <p className="text-base font-semibold text-white">{bmiData ? `${bmiData.weightKg} kg` : '--'}</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-white/40">Height</p>
              <p className="text-base font-semibold text-white">{bmiData ? `${bmiData.heightCm} cm` : '--'}</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-white/40">Healthy Range</p>
              <p className="text-base font-semibold text-[#d6f36b]">{bmiData ? bmiData.healthyRange : '--'}</p>
            </div>
          </div>
        </div>

        {/* Personalized Coach BMI Insight */}
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/8 p-3.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#d6f36b]/15 text-[#d6f36b]">
            <Sparkles size={15} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#d6f36b]">AI Coach Assessment & Recommendations</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/70">{bmiData?.advice}</p>
          </div>
        </div>
      </div>

      {/* ─── 2. AI Workout Suggestions with YouTube Videos & Tips ─────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-[-.02em] text-white">Recommended Routines for {activeGoal}</h2>
            <p className="text-xs text-white/40">Targeted exercises, curated coach video tutorials, and form cues.</p>
          </div>
          {loadingSuggestions && (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Loader2 size={13} className="animate-spin text-[#d6f36b]" /> Updating suggestions…
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {suggestions.map((w, idx) => {
            const isVideoActive = activeVideoId === w.id
            const isLogged = loggedWorkoutIds[w.id]
            return (
              <div
                key={w.id}
                className="dark-card card-enter flex flex-col justify-between border border-white/10 hover:border-[#d6f36b]/30 transition-all"
                style={{ animationDelay: `${100 + idx * 70}ms` }}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-white/10 text-white/70">
                          {w.level}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded ${
                          w.intensity === 'Hard' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          w.intensity === 'Moderate' ? 'bg-[#f4c96b]/20 text-[#f4c96b] border border-[#f4c96b]/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {w.intensity} Intensity
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-white leading-snug">{w.title}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-bold text-[#d6f36b]">{w.durationMin}</span>
                      <span className="text-xs text-white/40"> mins</span>
                      <p className="text-[10px] text-white/35">{w.caloriesBurn}</p>
                    </div>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-white/60">{w.description}</p>

                  {/* Muscle focus tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {w.targetMuscles.map((m: string) => (
                      <span key={m} className="px-2 py-0.5 rounded text-[11px] bg-white/5 text-white/50 border border-white/5">
                        {m}
                      </span>
                    ))}
                  </div>

                  {/* AI Tip Callout */}
                  <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/5 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#f4c96b]">
                      <Lightbulb size={13} /> Coach Workout Tip
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/60">{w.bmiTip}</p>
                  </div>

                  {/* Exercise Routine breakdown */}
                  <div className="mt-4 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Target Exercise Routine</p>
                    {w.exercises?.map((ex: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-1 px-2.5 rounded bg-white/[0.02] border border-white/5 text-xs">
                        <span className="font-medium text-white/80">{ex.name}</span>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-[#d6f36b] font-semibold">{ex.setsReps}</span>
                          <span className="text-white/30 text-[11px]">{ex.rest}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* YouTube Video Section */}
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-600/20 text-red-400">
                          <Video size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{w.youtube.title}</p>
                          <p className="text-[10px] text-white/40">{w.youtube.channel} · Video Tutorial</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setActiveVideoId(isVideoActive ? null : w.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-500 transition-colors"
                        >
                          <Play size={12} fill="white" /> {isVideoActive ? 'Hide' : 'Watch'}
                        </button>
                        <a
                          href={w.youtube.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                          title="Open on YouTube"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>

                    {/* Embedded YouTube Player if toggled */}
                    {isVideoActive && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-white/15 aspect-video w-full bg-black">
                        <iframe
                          className="w-full h-full"
                          src={`${w.youtube.embedUrl}?autoplay=1`}
                          title={w.youtube.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Log this workout CTA */}
                <div className="mt-5 pt-4 border-t border-white/8 flex items-center justify-between">
                  <span className="text-xs text-white/40">Ready to train?</span>
                  <button
                    onClick={() => logRecommendedWorkout(w)}
                    disabled={isLogged}
                    className="primary-button text-xs py-2 px-4"
                  >
                    {isLogged ? (
                      <><Check size={14} /> Logged to history!</>
                    ) : (
                      <><Check size={14} /> Log this workout</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 3. Stats & Custom Workout Logger ─────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2 mb-6">
        <div className="dark-card card-enter" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-medium text-white">Your Weekly Training Stats</h2>
            <MoreHorizontal size={16} className="text-white/30" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-box">
              <p className="eyebrow">This week</p>
              <p className="mt-2 text-2xl font-semibold text-white">{thisWeek}</p>
              <p className="mt-1 text-xs text-white/35">sessions</p>
            </div>
            <div className="stat-box">
              <p className="eyebrow">Total time</p>
              <p className="mt-2 text-2xl font-semibold text-[#d6f36b]">
                {workouts.reduce((s, w) => s + (w.durationMin || 0), 0)}
                <span className="text-xs font-normal text-white/40"> min</span>
              </p>
              <p className="mt-1 text-xs text-white/35">active</p>
            </div>
            <div className="stat-box">
              <p className="eyebrow">All-time</p>
              <p className="mt-2 text-2xl font-semibold text-white">{workouts.length}</p>
              <p className="mt-1 text-xs text-white/35">workouts</p>
            </div>
          </div>
        </div>

        {/* Custom Logger */}
        <div className="feature-card card-enter" style={{ animationDelay: '220ms' }}>
          {showForm ? (
            <div className="space-y-3" style={{ animation: 'fadeInUp .3s ease both' }}>
              <p className="eyebrow text-[#d6f36b]/70">Log a Custom Session</p>
              <input
                className="text-input w-full"
                placeholder="Workout name (e.g. 5km Treadmill Run or Leg Day)"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Duration (min)</label>
                  <input
                    className="text-input w-full"
                    type="number"
                    value={form.durationMin}
                    onChange={e => setForm(f => ({ ...f, durationMin: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Intensity</label>
                  <select
                    className="text-input w-full"
                    value={form.intensity}
                    onChange={e => setForm(f => ({ ...f, intensity: e.target.value }))}
                  >
                    <option>Easy</option>
                    <option>Moderate</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>
              <input
                className="text-input w-full"
                placeholder="Notes (optional, e.g. felt energetic, 80kg squats)"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
              <div className="flex gap-2">
                <button className="primary-button flex-1" onClick={logWorkout} disabled={logging}>
                  {logging ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save workout</>}
                </button>
                <button className="back-button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="eyebrow text-[#d6f36b]/70">Log Custom Training</p>
              <h2 className="mt-2 text-xl font-medium text-white">Did a different session?</h2>
              <p className="mt-2 text-sm text-white/45">
                Log any run, gym session, sport, or home workout to keep your streak and volume accurate.
              </p>
              <button className="primary-button mt-5" onClick={() => setShowForm(true)}>
                <Plus size={15} /> Log custom workout
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── 4. Workout History ───────────────────────────────────────────── */}
      <div className="dark-card card-enter" style={{ animationDelay: '260ms' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium text-white">Workout History</h2>
          <span className="text-xs text-white/35">{workouts.length} total completed</span>
        </div>
        {loadingWorkouts ? (
          <div className="flex items-center justify-center py-8 text-white/30 gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading workouts…
          </div>
        ) : workouts.length === 0 ? (
          <div className="py-8 text-center text-sm text-white/30">
            No workouts logged yet. Select a recommended routine above or log a custom session!
          </div>
        ) : (
          <div className="space-y-2">
            {workouts.map(w => (
              <div key={w.id} className="stat-box flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#d6f36b]">
                  <Activity size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white/80 truncate">{w.name}</p>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    {w.durationMin} min · {w.intensity} · {new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {w.notes ? ` · ${w.notes}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => removeWorkout(w.id)}
                  className="shrink-0 rounded p-1.5 text-white/20 hover:text-red-400 transition-colors"
                  title="Delete workout"
                >
                  <ShieldCheck size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Nutrition View ─────────────────────────────────────────────────────── */
function NutritionView() {
  const [meals, setMeals] = useState<Array<{id:string;name:string;calories:number;protein:number;carbs:number;fat:number;mealType:string;time:string}>>([])
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [loadingMeals, setLoadingMeals] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', mealType: 'Breakfast' })

  // Advanced Nutrition Plan state
  const [plan, setPlan] = useState<any>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [waterLoggedMl, setWaterLoggedMl] = useState<number>(1250)
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({})

  // ML / AI Meal Calorie & Macro Estimator state
  const [mlQuery, setMlQuery] = useState('')
  const [mlEstimating, setMlEstimating] = useState(false)
  const [mlResult, setMlResult] = useState<any>(null)
  const [mlError, setMlError] = useState<string | null>(null)
  const [mlAdding, setMlAdding] = useState(false)
  const [mlMealType, setMlMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch')

  async function estimateNutrition(textToEstimate?: string) {
    const query = (textToEstimate || mlQuery).trim()
    if (!query) return
    setMlEstimating(true)
    setMlError(null)
    try {
      const res = await fetch('/api/nutrition/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealText: query }),
      })
      const data = await res.json()
      if (res.ok) {
        setMlResult(data)
      } else {
        setMlError(data.error || 'Failed to estimate nutrition.')
      }
    } catch {
      setMlError('Network error while analyzing meal.')
    } finally {
      setMlEstimating(false)
    }
  }

  async function addMlMealToLog() {
    if (!mlResult) return
    setMlAdding(true)
    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mlResult.mealText,
          calories: mlResult.totals.calories,
          protein: mlResult.totals.protein,
          carbs: mlResult.totals.carbs,
          fat: mlResult.totals.fat,
          mealType: mlMealType,
        }),
      })
      if (res.ok) {
        const { meal } = await res.json()
        setMeals(prev => [...prev, meal])
        setTotals(prev => ({
          calories: prev.calories + meal.calories,
          protein: prev.protein + meal.protein,
          carbs: prev.carbs + meal.carbs,
          fat: prev.fat + meal.fat,
        }))
        setMlResult(null)
        setMlQuery('')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setMlAdding(false)
    }
  }

  // Fetch logged meals
  useEffect(() => {
    fetch('/api/nutrition')
      .then(r => r.json())
      .then(d => {
        if (d.meals) {
          setMeals(d.meals)
          setTotals(d.totals)
        }
      })
      .finally(() => setLoadingMeals(false))
  }, [])

  // Fetch personalized diet plan with calorie deficit & products
  useEffect(() => {
    fetch('/api/suggestions/nutrition')
      .then(r => r.json())
      .then(d => {
        if (d.targets) setPlan(d)
      })
      .catch(console.error)
      .finally(() => setLoadingPlan(false))
  }, [])

  async function addMeal() {
    if (!form.name.trim() || !form.calories) return
    setSaving(true)
    const res = await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
      }),
    })
    if (res.ok) {
      const { meal } = await res.json()
      setMeals(prev => [...prev, meal])
      setTotals(prev => ({
        calories: prev.calories + meal.calories,
        protein: prev.protein + meal.protein,
        carbs: prev.carbs + meal.carbs,
        fat: prev.fat + meal.fat,
      }))
      setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', mealType: 'Breakfast' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function logProductAsMeal(product: any, slotName: string) {
    setAddedProductIds(prev => ({ ...prev, [product.id]: true }))
    try {
      // Map slot to mealType
      let mappedType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' = 'Snack'
      if (slotName.includes('Breakfast')) mappedType = 'Breakfast'
      else if (slotName.includes('Lunch')) mappedType = 'Lunch'
      else if (slotName.includes('Dinner')) mappedType = 'Dinner'

      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${product.product} (${product.portion})`,
          calories: product.calories,
          protein: product.protein,
          carbs: product.carbs,
          fat: product.fat,
          mealType: mappedType,
        }),
      })
      if (res.ok) {
        const { meal } = await res.json()
        setMeals(prev => [...prev, meal])
        setTotals(prev => ({
          calories: prev.calories + meal.calories,
          protein: prev.protein + meal.protein,
          carbs: prev.carbs + meal.carbs,
          fat: prev.fat + meal.fat,
        }))
        setTimeout(() => {
          setAddedProductIds(prev => ({ ...prev, [product.id]: false }))
        }, 3000)
      }
    } catch {
      setAddedProductIds(prev => ({ ...prev, [product.id]: false }))
    }
  }

  async function removeMeal(id: string, cal: number, prot: number, carb: number, f: number) {
    await fetch(`/api/nutrition?id=${id}`, { method: 'DELETE' })
    setMeals(prev => prev.filter(m => m.id !== id))
    setTotals(prev => ({
      calories: prev.calories - cal,
      protein: prev.protein - prot,
      carbs: prev.carbs - carb,
      fat: prev.fat - f,
    }))
  }

  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

  const targetCals = plan?.targets?.calories || 2000
  const targetProt = plan?.targets?.protein || 140
  const targetCarb = plan?.targets?.carbs || 200
  const targetFat = plan?.targets?.fat || 65

  const waterTargetLiters = plan?.targets?.waterLiters || 2.5
  const waterTargetMl = Math.round(waterTargetLiters * 1000)
  const waterPercent = Math.min(100, Math.round((waterLoggedMl / waterTargetMl) * 100))

  return (
    <>
      <header className="mb-6 card-enter">
        <p className="eyebrow">SmartFit Nutritional Science</p>
        <div className="mt-2 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="icon-tile text-[#d6f36b]"><Apple size={19} /></div>
            <h1 className="text-3xl font-semibold tracking-[-.04em] text-white">Smart Diet & Deficit Plan</h1>
          </div>
          {plan && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#d6f36b]/15 text-[#d6f36b] border border-[#d6f36b]/30">
              {plan.metabolism.planType} ({plan.dietPreference})
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-white/40">
          Scientifically calculated calorie deficit, daily macro targets, product-wise meal portions, and hydration monitoring.
        </p>
      </header>

      {/* ─── 1. Calorie Deficit & Metabolism Calculation Plan ──────────────── */}
      {plan && (
        <div className="dark-card mb-6 card-enter border border-white/10" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-[#d6f36b]">Energy Balance Equation</p>
              <h2 className="text-lg font-semibold text-white">{plan.metabolism.planType}</h2>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              {plan.metabolism.projectedWeeklyChange}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="stat-box">
              <p className="eyebrow">Basal Metabolic Rate (BMR)</p>
              <p className="mt-2 text-xl font-bold text-white">{plan.metabolism.bmr} <span className="text-xs font-normal text-white/40">kcal</span></p>
              <p className="mt-1 text-[10px] text-white/35">Basal body burn at rest</p>
            </div>
            <div className="stat-box">
              <p className="eyebrow">Maintenance (TDEE)</p>
              <p className="mt-2 text-xl font-bold text-white">{plan.metabolism.tdee} <span className="text-xs font-normal text-white/40">kcal</span></p>
              <p className="mt-1 text-[10px] text-white/35">Includes physical activity</p>
            </div>
            <div className="stat-box">
              <p className="eyebrow">Target Deficit / Adjustment</p>
              <p className="mt-2 text-xl font-bold text-[#d6f36b]">
                {plan.metabolism.calorieDelta > 0 ? `+${plan.metabolism.calorieDelta}` : plan.metabolism.calorieDelta} <span className="text-xs font-normal text-white/40">kcal</span>
              </p>
              <p className="mt-1 text-[10px] text-white/35">Daily metabolic deficit</p>
            </div>
            <div className="stat-box border-[#d6f36b]/30 bg-[#d6f36b]/[0.03]">
              <p className="eyebrow text-[#d6f36b]">Target Daily Calories</p>
              <p className="mt-2 text-2xl font-bold text-[#d6f36b]">{plan.targets.calories} <span className="text-xs font-normal text-white/60">kcal</span></p>
              <p className="mt-1 text-[10px] text-white/50">Your exact daily target</p>
            </div>
          </div>

          <p className="mt-3.5 text-xs leading-relaxed text-white/60 border-t border-white/5 pt-3">
            {plan.metabolism.planDescription}
          </p>
        </div>
      )}

      {/* ─── 2. Daily Water Intake & Hydration Tracker ──────────────────────── */}
      <div className="dark-card mb-6 card-enter border border-blue-500/20 bg-gradient-to-br from-blue-950/20 via-transparent to-transparent" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <Droplets size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Hydration & Daily Water Intake</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Target: {waterTargetLiters} L / day
                </span>
              </div>
              <p className="text-xs text-white/40">
                Calculated on bodyweight (35ml/kg) + workout sweat compensation ({plan?.targets?.waterGlasses || 10} standard 250ml glasses).
              </p>
            </div>
          </div>

          {/* Interactive Water Logger Controls */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xl font-bold text-blue-300">{(waterLoggedMl / 1000).toFixed(2)}</span>
              <span className="text-xs text-white/40"> / {waterTargetLiters} L</span>
              <p className="text-[10px] text-white/35">{waterPercent}% completed</p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setWaterLoggedMl(v => Math.max(0, v - 250))}
                className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Subtract 250ml glass"
              >
                - 250ml
              </button>
              <button
                onClick={() => setWaterLoggedMl(v => v + 250)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-500 transition-colors shadow-sm"
                title="Add 250ml glass"
              >
                <Plus size={13} /> + 250ml Glass
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${waterPercent}%` }}
          />
        </div>
      </div>

      {/* ─── 3. Macro Targets vs Today's Logged Macros ────────────────────── */}
      <div className="mb-6 card-enter" style={{ animationDelay: '140ms' }}>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-3">Today&apos;s Macros vs Daily Target</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Calories', logged: totals.calories, target: targetCals, unit: 'kcal', color: '#f4c96b' },
            { label: 'Protein',  logged: totals.protein,  target: targetProt, unit: 'g',    color: '#d6f36b' },
            { label: 'Carbs',    logged: totals.carbs,    target: targetCarb, unit: 'g',    color: '#a6d8e8' },
            { label: 'Fat',      logged: totals.fat,      target: targetFat,  unit: 'g',    color: '#f5a97f' },
          ].map(m => {
            const pct = Math.min(100, Math.round((m.logged / m.target) * 100)) || 0
            return (
              <div key={m.label} className="stat-box">
                <div className="flex justify-between items-baseline">
                  <p className="eyebrow">{m.label}</p>
                  <span className="text-[11px] font-semibold" style={{ color: m.color }}>{pct}%</span>
                </div>
                <p className="mt-2 text-2xl font-semibold" style={{ color: m.color }}>
                  {m.logged}
                  <span className="text-xs font-normal text-white/40"> / {m.target} {m.unit}</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: m.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 4. Product-Wise Meal Breakdown Plan ──────────────────────────── */}
      {plan && plan.meals && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[-.02em] text-white">Product-Wise Daily Diet Plan</h2>
              <p className="text-xs text-white/40">
                Portion-controlled food products with exact calorie, protein, carbohydrate, fat, and fiber breakdown.
              </p>
            </div>
            <span className="text-xs text-[#d6f36b] font-medium">5 Structured Meals</span>
          </div>

          <div className="space-y-4">
            {plan.meals.map((slot: any) => (
              <div key={slot.slotName} className="dark-card border border-white/10 card-enter">
                <div className="flex items-center justify-between pb-3 border-b border-white/8">
                  <div className="flex items-center gap-2.5">
                    <span className="size-2 rounded-full bg-[#d6f36b]" />
                    <h3 className="text-base font-semibold text-white">{slot.slotName}</h3>
                    <span className="text-xs text-white/40">· {slot.time}</span>
                  </div>
                  <span className="text-xs font-medium text-white/50">
                    Slot Budget: <span className="text-[#d6f36b] font-semibold">{slot.targetCalories} kcal</span>
                  </span>
                </div>

                {/* Product Items Table / Cards */}
                <div className="mt-3 divide-y divide-white/5">
                  {slot.products.map((p: any) => {
                    const isAdded = addedProductIds[p.id]
                    return (
                      <div key={p.id} className="py-3 flex items-start justify-between flex-wrap gap-3 hover:bg-white/[0.01] px-1 rounded-lg transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white">{p.product}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-white/60 border border-white/5">
                              {p.portion}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#d6f36b]/10 text-[#d6f36b]">
                              {p.productCategory}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-white/50 leading-relaxed">
                            <span className="text-[#d6f36b]/80 font-medium">Why chosen:</span> {p.whyChosen}
                          </p>

                          {/* Product-wise macro chips */}
                          <div className="mt-2 flex items-center gap-3 text-xs flex-wrap">
                            <span className="font-semibold text-[#f4c96b]">{p.calories} kcal</span>
                            <span className="text-white/30">·</span>
                            <span className="text-[#d6f36b] font-medium">P: {p.protein}g</span>
                            <span className="text-white/30">·</span>
                            <span className="text-[#a6d8e8] font-medium">C: {p.carbs}g</span>
                            <span className="text-white/30">·</span>
                            <span className="text-[#f5a97f] font-medium">F: {p.fat}g</span>
                            <span className="text-white/30">·</span>
                            <span className="text-emerald-400 font-medium">Fiber: {p.fiber}g</span>
                            {p.waterMl > 0 && (
                              <>
                                <span className="text-white/30">·</span>
                                <span className="text-blue-300 font-medium">💧 {p.waterMl}ml</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Quick Add to Log */}
                        <button
                          onClick={() => logProductAsMeal(p, slot.slotName)}
                          disabled={isAdded}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white hover:border-[#d6f36b]/40 hover:bg-[#d6f36b]/10 transition-colors"
                        >
                          {isAdded ? (
                            <><Check size={13} className="text-[#d6f36b]" /> Logged!</>
                          ) : (
                            <><Plus size={13} /> Add to Log</>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Daily Product Summary */}
          {plan.productSummary && (
            <div className="mt-4 dark-card border border-white/10 bg-white/[0.02] p-4 card-enter">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-white/50 mb-2">Full Meal Plan Daily Totals</h4>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="stat-box py-2"><p className="text-white/40 text-[10px]">Calories</p><p className="font-bold text-white text-sm">{plan.productSummary.totalCalories} kcal</p></div>
                <div className="stat-box py-2"><p className="text-white/40 text-[10px]">Protein</p><p className="font-bold text-[#d6f36b] text-sm">{plan.productSummary.totalProtein}g</p></div>
                <div className="stat-box py-2"><p className="text-white/40 text-[10px]">Carbohydrates</p><p className="font-bold text-[#a6d8e8] text-sm">{plan.productSummary.totalCarbs}g</p></div>
                <div className="stat-box py-2"><p className="text-white/40 text-[10px]">Fats</p><p className="font-bold text-[#f5a97f] text-sm">{plan.productSummary.totalFat}g</p></div>
                <div className="stat-box py-2"><p className="text-white/40 text-[10px]">Fiber</p><p className="font-bold text-emerald-400 text-sm">{plan.productSummary.totalFiber}g</p></div>
                <div className="stat-box py-2"><p className="text-white/40 text-[10px]">Food Water</p><p className="font-bold text-blue-300 text-sm">{plan.productSummary.totalWaterMl}ml</p></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 5. AI / ML Instant Meal Calorie & Macro Estimator ───────────── */}
      <div className="dark-card mb-6 card-enter border border-[#d6f36b]/30 bg-gradient-to-br from-[#d6f36b]/[0.04] via-transparent to-transparent shadow-xl" style={{ animationDelay: '180ms' }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#d6f36b]/15 text-[#d6f36b]">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">AI / ML Meal Calorie & Macro Estimator</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d6f36b] text-black">
                  NLP MODEL
                </span>
              </div>
              <p className="text-xs text-white/50">
                Type ANY meal, ingredients, or dish name — the model computes total calories, proteins, carbs, and fats.
              </p>
            </div>
          </div>
          {mlResult && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {mlResult.healthScore}
            </span>
          )}
        </div>

        {/* Input & Analyze Bar */}
        <div className="mt-4 flex gap-2 flex-wrap sm:flex-nowrap">
          <input
            className="text-input flex-1 min-w-[240px] text-sm"
            placeholder="e.g. 2 boiled eggs with 2 slices of whole wheat toast and half avocado"
            value={mlQuery}
            onChange={e => setMlQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') estimateNutrition() }}
          />
          <button
            onClick={() => estimateNutrition()}
            disabled={mlEstimating || !mlQuery.trim()}
            className="primary-button text-xs py-2.5 px-5 shrink-0"
          >
            {mlEstimating ? (
              <><Loader2 size={14} className="animate-spin" /> Estimating…</>
            ) : (
              <><Sparkles size={14} /> Calculate with ML</>
            )}
          </button>
        </div>

        {/* Quick Example Chips */}
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-xs text-white/40">
          <span className="text-[11px] font-medium text-white/30">Try examples:</span>
          {[
            '2 boiled eggs with 2 slices toast and avocado',
            '1 scoop whey protein with 1 cup milk and banana',
            '200g grilled chicken breast with 1 cup brown rice and broccoli',
            '1 bowl dal with 2 roti and salad',
            '1 cheeseburger with medium fries',
          ].map(ex => (
            <button
              key={ex}
              onClick={() => {
                setMlQuery(ex)
                estimateNutrition(ex)
              }}
              className="px-2 py-0.5 rounded text-[11px] bg-white/5 text-white/60 hover:text-[#d6f36b] hover:bg-white/10 transition-colors border border-white/5"
            >
              {ex}
            </button>
          ))}
        </div>

        {mlError && (
          <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
            {mlError}
          </p>
        )}

        {/* ML Result Display */}
        {mlResult && (
          <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 space-y-4" style={{ animation: 'fadeInUp .3s ease both' }}>
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/8">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/40">Analyzed Meal</p>
                <h3 className="text-base font-semibold text-white capitalize">{mlResult.mealText}</h3>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#f4c96b]">{mlResult.totals.calories}</span>
                <span className="text-xs font-medium text-white/50">kcal total</span>
              </div>
            </div>

            {/* 4 Macros Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="stat-box text-center bg-white/[0.02]">
                <p className="eyebrow text-[#d6f36b]">Protein</p>
                <p className="mt-1 text-2xl font-bold text-[#d6f36b]">{mlResult.totals.protein}g</p>
                <p className="text-[10px] text-white/40">{mlResult.macroPercentages.protein}% of energy</p>
              </div>
              <div className="stat-box text-center bg-white/[0.02]">
                <p className="eyebrow text-[#a6d8e8]">Carbohydrates</p>
                <p className="mt-1 text-2xl font-bold text-[#a6d8e8]">{mlResult.totals.carbs}g</p>
                <p className="text-[10px] text-white/40">{mlResult.macroPercentages.carbs}% of energy</p>
              </div>
              <div className="stat-box text-center bg-white/[0.02]">
                <p className="eyebrow text-[#f5a97f]">Fats</p>
                <p className="mt-1 text-2xl font-bold text-[#f5a97f]">{mlResult.totals.fat}g</p>
                <p className="text-[10px] text-white/40">{mlResult.macroPercentages.fat}% of energy</p>
              </div>
              <div className="stat-box text-center bg-white/[0.02]">
                <p className="eyebrow text-emerald-400">Dietary Fiber</p>
                <p className="mt-1 text-2xl font-bold text-emerald-400">{mlResult.totals.fiber}g</p>
                <p className="text-[10px] text-white/40">Digestive health</p>
              </div>
            </div>

            {/* Recognized Items Breakdown */}
            {mlResult.detectedItems && mlResult.detectedItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Item-by-Item Breakdown</p>
                <div className="space-y-1.5">
                  {mlResult.detectedItems.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
                      <div>
                        <span className="font-medium text-white">{item.name}</span>
                        <span className="ml-2 text-white/40 text-[11px]">({item.quantity})</span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="font-semibold text-[#f4c96b]">{item.calories} kcal</span>
                        <span className="text-white/30 text-[11px]">P:{item.protein}g C:{item.carbs}g F:{item.fat}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar: Add directly to Log */}
            <div className="pt-3 border-t border-white/8 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Log as:</span>
                <select
                  className="text-input py-1 text-xs"
                  value={mlMealType}
                  onChange={e => setMlMealType(e.target.value as any)}
                >
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Dinner</option>
                  <option>Snack</option>
                </select>
              </div>

              <button
                onClick={addMlMealToLog}
                disabled={mlAdding}
                className="primary-button text-xs py-2 px-4"
              >
                {mlAdding ? (
                  <><Loader2 size={13} className="animate-spin" /> Saving to log…</>
                ) : (
                  <><Check size={13} /> Add this Meal to Today&apos;s Log</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── 6. Custom Meal Logging & Today's Meals ───────────────────────── */}
      <div className="feature-card mb-6 card-enter" style={{ animationDelay: '200ms' }}>
        {showForm ? (
          <div className="space-y-3" style={{ animation: 'fadeInUp .3s ease both' }}>
            <p className="eyebrow text-[#d6f36b]/70">Log Custom Food or Meal</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="text-input"
                placeholder="Food name (e.g. Scrambled Eggs or Protein Shake)"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <select
                className="text-input"
                value={form.mealType}
                onChange={e => setForm(f => ({ ...f, mealType: e.target.value }))}
              >
                {mealTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['calories', 'protein', 'carbs', 'fat'] as const).map(k => (
                <div key={k}>
                  <label className="form-label capitalize">{k} {k !== 'calories' ? '(g)' : '(kcal)'}</label>
                  <input
                    className="text-input w-full"
                    type="number"
                    placeholder="0"
                    value={form[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="primary-button flex-1" onClick={addMeal} disabled={saving}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Add meal to log</>}
              </button>
              <button className="back-button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow text-[#d6f36b]/70">Track Everything You Eat</p>
              <h2 className="mt-1 text-lg font-medium text-white">Log Custom Meal</h2>
            </div>
            <button className="primary-button" onClick={() => setShowForm(true)}>
              <Plus size={15} /> Add meal
            </button>
          </div>
        )}
      </div>

      {/* Meals list */}
      <div className="dark-card card-enter" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium text-white">Today&apos;s Logged Meals</h2>
          <span className="text-xs text-white/35">{meals.length} logged today</span>
        </div>
        {loadingMeals ? (
          <div className="flex items-center justify-center py-8 text-white/30 gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading meals…
          </div>
        ) : meals.length === 0 ? (
          <div className="py-8 text-center text-sm text-white/30">
            No meals logged today yet. Use the product list above or hit &ldquo;Add meal&rdquo; to track!
          </div>
        ) : (
          <div className="space-y-2">
            {meals.map(m => (
              <div key={m.id} className="stat-box flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#f4c96b]">
                  <Flame size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white/80 truncate">{m.name}</p>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    {m.mealType} · {m.calories} kcal · P: {m.protein}g · C: {m.carbs}g · F: {m.fat}g · {m.time}
                  </p>
                </div>
                <button
                  onClick={() => removeMeal(m.id, m.calories, m.protein, m.carbs, m.fat)}
                  className="shrink-0 rounded p-1.5 text-white/20 hover:text-red-400 transition-colors"
                  title="Remove meal"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Profile View ───────────────────────────────────────────────────────── */
function ProfileView({ user, onLogout }: { user: { name: string; email: string } | null; onLogout: () => void }) {
  const [profile, setProfile] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.user?.profile) setProfile(d.user.profile)
    }).finally(() => setLoading(false))
  }, [])

  async function saveProfile() {
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  const field = (label: string, key: string, placeholder = '') => (
    <div key={key}>
      <label className="form-label">{label}</label>
      <input className="text-input w-full" value={profile[key] ?? ''} placeholder={placeholder}
        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} />
    </div>
  )

  const select = (label: string, key: string, options: string[]) => (
    <div key={key}>
      <label className="form-label">{label}</label>
      <div className="select-wrap">
        <select className="text-input w-full" value={profile[key] ?? ''} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}>
          <option value="">Select one</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronRight size={14} className="rotate-90" />
      </div>
    </div>
  )

  // Live calculated BMI in profile
  const profileWeight = parseFloat(profile['weight'] || '0')
  const profileHeight = parseFloat(profile['height'] || '0')
  let profileBmi: number | null = null
  let profileCategory = ''
  let profileColor = '#d6f36b'
  if (profileWeight > 0 && profileHeight > 0) {
    let wKg = profileWeight
    let hCm = profileHeight
    if (profile['unit'] === 'imperial') {
      wKg *= 0.45359237
      hCm *= 2.54
    }
    const hM = hCm / 100
    profileBmi = Math.round((wKg / (hM * hM)) * 10) / 10
    if (profileBmi < 18.5) { profileCategory = 'Underweight'; profileColor = '#70d6ff' }
    else if (profileBmi < 25) { profileCategory = 'Normal weight'; profileColor = '#d6f36b' }
    else if (profileBmi < 30) { profileCategory = 'Overweight'; profileColor = '#ffd166' }
    else { profileCategory = 'Obese'; profileColor = '#ef476f' }
  }

  return (
    <>
      <header className="mb-8 card-enter">
        <p className="eyebrow">SmartFit AI</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="icon-tile text-[#d6f36b]"><UserRound size={19} /></div>
          <h1 className="text-3xl font-semibold tracking-[-.04em] text-white">Your profile</h1>
        </div>
        <p className="mt-2 text-sm text-white/40">Manage your goals, body metrics, and preferences.</p>
      </header>

      {/* Account card */}
      {user && (
        <div className="mb-5 dark-card card-enter flex items-center gap-4" style={{ animationDelay: '60ms' }}>
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#d6f36b]/15 text-xl font-semibold text-[#d6f36b]">
            {user.name[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-white truncate">{user.name}</p>
            <p className="mt-0.5 text-sm text-white/40 truncate">{user.email}</p>
          </div>
          <button onClick={onLogout} className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/30 gap-2"><Loader2 size={18} className="animate-spin" /> Loading profile…</div>
      ) : (
        <>
          {/* Body metrics */}
          <div className="dark-card mb-5 card-enter" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-base font-medium text-white">Body metrics</h2>
              {profileBmi && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">Calculated BMI:</span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${profileColor}20`,
                      color: profileColor,
                      border: `1px solid ${profileColor}40`,
                    }}
                  >
                    {profileBmi} · {profileCategory}
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('Date of birth', 'dob')}
              {select('Sex', 'sex', ['Female', 'Male', 'Non-binary', 'Prefer not to say'])}
              {field('Height', 'height', 'cm or ft')}
              {field('Weight', 'weight', 'kg or lb')}
              {select('Units', 'unit', ['metric', 'imperial'])}
            </div>
          </div>

          {/* Goals */}
          <div className="dark-card mb-5 card-enter" style={{ animationDelay: '200ms' }}>
            <h2 className="text-base font-medium text-white mb-4">Training goals</h2>
            <div className="grid grid-cols-2 gap-4">
              {select('Primary goal', 'goal', ['Build strength', 'Improve endurance', 'Lose body fat', 'Build muscle', 'Stay healthy'])}
              {select('Activity level', 'activity', ['Just starting', '1–2 sessions / week', '3–4 sessions / week', '5+ sessions / week'])}
              {select('Preferred training', 'training', ['Strength training', 'Running', 'Cycling', 'Mixed training', 'Sports performance'])}
              {select('Dietary preference', 'diet', ['No preference', 'Vegetarian', 'Vegan', 'Pescatarian', 'Other'])}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 card-enter" style={{ animationDelay: '280ms' }}>
            <button className="primary-button" onClick={saveProfile} disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : saved ? <><Check size={14} /> Saved!</> : 'Save changes'}
            </button>
            {saved && <span className="text-sm text-[#d6f36b]" style={{ animation: 'fadeInUp .3s ease both' }}>Profile updated ✓</span>}
          </div>
        </>
      )}
    </>
  )
}


/* ─── Root Page ──────────────────────────────────────────────────────────── */
export default function Page() {
  const router = useRouter()
  const [view, setView] = useState<View>('Home')
  const [coachOpen, setCoachOpen] = useState(false)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const prevView = useRef<View>('Home')

  // Fetch logged-in user
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user) })
      .catch(() => {})
  }, [])

  // Fetch live metrics on mount and every 60 s
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/metrics')
        if (res.ok) setMetrics(await res.json())
      } catch { /* silent */ }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/me', { method: 'DELETE' })
    setUser(null)
    router.push('/login')
  }

  function navigate(v: View) {
    prevView.current = view
    setView(v)
  }

  // Derive display values from real user
  const firstName  = user?.name?.trim().split(' ')[0] ?? 'Athlete'
  const initials   = user?.name
    ? user.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <main className="min-h-screen bg-[#0d100c] text-white">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Activity size={18} /></div>
          <span>smartfit<span className="text-[#d6f36b]">.</span></span>
          <span className="brand-ai">AI</span>
        </div>
        <nav className="mt-12 flex flex-col gap-2">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => navigate(label)} className={`nav-button ${view === label ? 'active' : ''}`}>
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="coach-card">
            <Sparkles size={16} className="text-[#d6f36b]" />
            <p className="mt-3 text-xs font-medium text-white">Your AI coach is ready.</p>
            <p className="mt-1 text-[11px] leading-4 text-white/35">Ask anything about your training.</p>
            <button onClick={() => setCoachOpen(true)} className="mt-4 text-[11px] font-medium text-[#d6f36b]">
              Start a chat <ChevronRight className="inline" size={12} />
            </button>
          </div>
          {user ? (
            <button onClick={handleLogout} className="nav-button mt-4 text-white/40 hover:text-red-400">
              <LogOut size={17} />Sign out
            </button>
          ) : (
            <button className="nav-button mt-4 text-white/40"><Settings size={17} />Settings</button>
          )}
        </div>
      </aside>

      {/* Main shell */}
      <div className="main-shell">
        <div className="mobile-header">
          <div className="brand">
            <div className="brand-mark"><Activity size={16} /></div>
            <span>smartfit<span className="text-[#d6f36b]">.</span></span>
          </div>
          <button className="avatar" aria-label="Open profile">{initials}</button>
        </div>
        <div className="content" key={view}>
          {view === 'Home'
            ? <HomeView metrics={metrics} firstName={firstName} />
            : <SecondaryView view={view} user={user} onLogout={handleLogout} />
          }
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="mobile-nav">
        {navItems.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => navigate(label)} className={view === label ? 'active' : ''}>
            <Icon size={18} /><span>{label}</span>
          </button>
        ))}
      </nav>

      {/* AI Coach overlay */}
      {coachOpen && <CoachChat onClose={() => setCoachOpen(false)} metrics={metrics} />}
    </main>
  )
}


