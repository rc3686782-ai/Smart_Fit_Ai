'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity, ArrowLeft, ArrowRight, Check, ChevronDown,
  Eye, EyeOff, Loader2, LockKeyhole, Mail, Target,
} from 'lucide-react'
import { useState } from 'react'

type FormData = {
  name: string; email: string; password: string
  dob: string; sex: string
  height: string; weight: string; unit: string
  goal: string; activity: string; training: string; diet: string
}

const initial: FormData = {
  name: '', email: '', password: '',
  dob: '', sex: '',
  height: '', weight: '', unit: 'metric',
  goal: '', activity: '', training: '', diet: '',
}

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [data, setData] = useState(initial)

  const update = (key: keyof FormData, value: string) =>
    setData((cur) => ({ ...cur, [key]: value }))

  const canContinue =
    step === 1 ? data.name.trim() && data.email.trim() && data.password.length >= 8
    : step === 2 ? data.dob && data.sex
    : step === 3 ? data.height && data.weight
    : data.goal && data.activity && data.training

  async function next() {
    if (!canContinue) return
    setError('')

    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }

    // Final step: create account + save profile
    setSaving(true)
    try {
      // 1. Create account
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      })
      const signupData = await signupRes.json()

      if (!signupRes.ok) {
        setError(signupData.error ?? 'Could not create account. Please try again.')
        setSaving(false)
        return
      }

      // 2. Save athlete profile
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dob: data.dob, sex: data.sex,
          height: data.height, weight: data.weight, unit: data.unit,
          goal: data.goal, activity: data.activity,
          training: data.training, diet: data.diet,
        }),
      })

      setDone(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const firstName = data.name.trim().split(' ')[0] || 'athlete'

  /* ── Success screen ── */
  if (done) return (
    <main className="onboarding-shell">
      <div className="success-card" style={{ animation: 'fadeInUp .6s ease both' }}>
        <div className="success-icon" style={{ animation: 'popIn .5s .2s ease both' }}>
          <Check size={25} />
        </div>
        <p className="eyebrow text-[#d6f36b]">Profile ready</p>
        <h1>You&apos;re set, {firstName}.</h1>
        <p>Your account is created and your baseline is saved. SmartFit will personalise every recommendation for you.</p>
        <Link href="/" className="primary-button">
          Go to dashboard <ArrowRight size={15} />
        </Link>
      </div>
    </main>
  )

  const stepLabel = [
    'Create your account',
    'About you',
    "Your body metrics",
    'Training goals',
  ][step - 1]

  const stepSub = [
    'Your details stay private and are only used to personalise your experience.',
    'This helps us make every recommendation feel personal.',
    'Use your current measurements. You can update them anytime.',
    'Choose what matters most right now. Your plan can evolve with you.',
  ][step - 1]

  /* ── Onboarding form ── */
  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <Link href="/" className="brand">
          <span className="brand-mark"><Activity size={17} /></span>
          <span>smartfit<span className="text-[#d6f36b]">.</span></span>
        </Link>
        <span className="step-count">Step {step} of {TOTAL_STEPS}</span>
      </header>

      <section className="onboarding-card" style={{ animation: 'fadeInUp .5s ease both' }}>
        {/* Progress bar */}
        <div className="progress-track">
          <span style={{ width: `${(step / TOTAL_STEPS) * 100}%`, transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
        </div>

        <div className="onboarding-intro">
          <div className="icon-tile text-[#d6f36b]"><Target size={18} /></div>
          <p className="eyebrow text-[#d6f36b]">Build your baseline</p>
          <h1>{stepLabel}</h1>
          <p>{stepSub}</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Step 1 — Account */}
        {step === 1 && (
          <div className="form-grid" style={{ animation: 'fadeInUp .35s ease both' }}>
            <div className="field-span">
              <label className="form-label" htmlFor="name">Full name</label>
              <input
                className="text-input" id="name" type="text" placeholder="Alex Morgan"
                value={data.name} onChange={(e) => update('name', e.target.value)} autoFocus
              />
            </div>
            <div className="field-span">
              <label className="form-label" htmlFor="email">Email address</label>
              <div className="input-wrap">
                <Mail size={15} />
                <input
                  id="email" type="email" placeholder="you@example.com" autoComplete="email"
                  value={data.email} onChange={(e) => update('email', e.target.value)}
                />
              </div>
            </div>
            <div className="field-span">
              <label className="form-label" htmlFor="password">
                Password <span className="text-white/25 font-normal normal-case tracking-normal">(min. 8 characters)</span>
              </label>
              <div className="input-wrap">
                <LockKeyhole size={15} />
                <input
                  id="password" type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password" autoComplete="new-password"
                  value={data.password} onChange={(e) => update('password', e.target.value)}
                />
                <button
                  type="button" className="input-action"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {data.password.length > 0 && data.password.length < 8 && (
                <p className="mt-1.5 text-[11px] text-red-400">Password must be at least 8 characters</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Personal info */}
        {step === 2 && (
          <div className="form-grid" style={{ animation: 'fadeInUp .35s ease both' }}>
            <Field label="Date of birth" id="dob" type="date" value={data.dob} onChange={(v) => update('dob', v)} />
            <SelectField label="Sex" value={data.sex} onChange={(v) => update('sex', v)}
              options={['Female', 'Male', 'Non-binary', 'Prefer not to say']} />
          </div>
        )}

        {/* Step 3 — Body metrics */}
        {step === 3 && (
          <div className="form-grid" style={{ animation: 'fadeInUp .35s ease both' }}>
            <div className="field-span">
              <label className="form-label" htmlFor="unit">Measurement system</label>
              <div className="segmented">
                <button type="button" className={data.unit === 'metric' ? 'selected' : ''} onClick={() => update('unit', 'metric')}>Metric (kg / cm)</button>
                <button type="button" className={data.unit === 'imperial' ? 'selected' : ''} onClick={() => update('unit', 'imperial')}>Imperial (lb / ft)</button>
              </div>
            </div>
            <Field label={`Height (${data.unit === 'metric' ? 'cm' : 'ft'})`} id="height"
              value={data.height} onChange={(v) => update('height', v)}
              placeholder={data.unit === 'metric' ? '178' : "5'10"} type="number" />
            <Field label={`Weight (${data.unit === 'metric' ? 'kg' : 'lb'})`} id="weight"
              value={data.weight} onChange={(v) => update('weight', v)}
              placeholder={data.unit === 'metric' ? '75' : '165'} type="number" />
          </div>
        )}

        {/* Step 4 — Goals */}
        {step === 4 && (
          <div className="form-grid" style={{ animation: 'fadeInUp .35s ease both' }}>
            <SelectField label="Primary goal" value={data.goal} onChange={(v) => update('goal', v)}
              options={['Build strength', 'Improve endurance', 'Lose body fat', 'Build muscle', 'Stay healthy']} />
            <SelectField label="Current activity level" value={data.activity} onChange={(v) => update('activity', v)}
              options={['Just starting', '1–2 sessions / week', '3–4 sessions / week', '5+ sessions / week']} />
            <SelectField label="Preferred training" value={data.training} onChange={(v) => update('training', v)}
              options={['Strength training', 'Running', 'Cycling', 'Mixed training', 'Sports performance']} />
            <SelectField label="Dietary preference" value={data.diet} onChange={(v) => update('diet', v)}
              options={['No preference', 'Vegetarian', 'Vegan', 'Pescatarian', 'Other']} />
          </div>
        )}

        {/* Navigation */}
        <div className="onboarding-actions">
          {step > 1 ? (
            <button className="back-button" type="button" onClick={() => { setError(''); setStep(step - 1) }}>
              <ArrowLeft size={15} /> Back
            </button>
          ) : (
            <Link href="/login" className="back-button">
              <ArrowLeft size={15} /> Sign in instead
            </Link>
          )}
          <button
            className="primary-button" type="button"
            onClick={next}
            disabled={!canContinue || saving}
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Creating account…</>
              : step === TOTAL_STEPS
                ? <>Finish &amp; create account <ArrowRight size={15} /></>
                : <>Continue <ArrowRight size={15} /></>
            }
          </button>
        </div>
      </section>
    </main>
  )
}

function Field({ label, id, value, onChange, placeholder, type = 'text' }: {
  label: string; id: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="form-label" htmlFor={id}>{label}</label>
      <input className="text-input" id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (value: string) => void; options: string[]
}) {
  return (
    <div>
      <label className="form-label" htmlFor={label}>{label}</label>
      <div className="select-wrap">
        <select className="text-input" id={label} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select one</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown size={15} />
      </div>
    </div>
  )
}
