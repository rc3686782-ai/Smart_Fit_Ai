'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Login failed.')
        return
      }
      router.push('/')
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell" style={{ animation: 'fadeInUp .55s ease both' }}>
      <section className="auth-panel">
        <Link href="/" className="brand auth-brand" aria-label="SmartFit home">
          <span className="brand-mark"><Activity size={18} /></span>
          <span>smartfit<span className="text-[#d6f36b]">.</span></span>
          <span className="brand-ai">AI</span>
        </Link>
        <div className="auth-copy" style={{ animation: 'fadeInUp .55s .1s ease both' }}>
          <p className="eyebrow text-[#d6f36b]">Welcome back</p>
          <h1>Train with more clarity.</h1>
          <p>Sign in to pick up where you left off and keep your performance moving forward.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit} style={{ animation: 'fadeInUp .55s .2s ease both' }}>
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <label className="form-label" htmlFor="email">Email address</label>
          <div className="input-wrap">
            <Mail size={16} />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label className="form-label" htmlFor="password">Password</label>
            <Link href="#forgot" className="form-link">Forgot password?</Link>
          </div>
          <div className="input-wrap">
            <LockKeyhole size={16} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="input-action"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <label className="check-row"><input type="checkbox" defaultChecked /> <span>Keep me signed in</span></label>
          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : <>Sign in <ArrowRight size={15} /></>}
          </button>
        </form>
        <div className="auth-divider" style={{ animation: 'fadeInUp .55s .3s ease both' }}><span>or continue with</span></div>
        <button className="social-button" type="button" style={{ animation: 'fadeInUp .55s .35s ease both' }}>
          <span className="google-mark">G</span> Continue with Google
        </button>
        <p className="auth-footer" style={{ animation: 'fadeInUp .55s .4s ease both' }}>
          New to SmartFit?{' '}
          <Link href="/onboarding" className="form-link">Create your athlete profile</Link>
        </p>
      </section>
      <aside className="auth-art" aria-label="SmartFit performance summary">
        <div className="art-glow" />
        <div className="art-content" style={{ animation: 'fadeInUp .7s .2s ease both' }}>
          <p className="eyebrow text-[#d6f36b]">Your performance, understood</p>
          <h2>Small signals.<br />Stronger decisions.</h2>
          <div className="art-stat">
            <span className="pulse-dot" />
            <div><strong>86%</strong><span> readiness today</span></div>
          </div>
        </div>
      </aside>
    </main>
  )
}
