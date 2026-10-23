'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowUp, Loader2, Sparkles, X } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

type Metrics = {
  readiness?: number; hrv?: number; restingHR?: number
  sleep?: { hours: number; minutes: number; score: number }
  calories?: { burned: number; consumed: number; goal: number }
  activeMinutes?: { current: number; goal: number }
} | null

const QUICK_PROMPTS = [
  'What should I eat post-workout?',
  'How do I improve my HRV?',
  'Give me a 20-min HIIT plan',
]

export function CoachChat({ onClose, metrics }: { onClose: () => void; metrics?: Metrics }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "I'm ready to help with your training, nutrition, or recovery. What are you working on today?" },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function submit(event: FormEvent | null, overrideMessage?: string) {
    event?.preventDefault()
    const text = overrideMessage ?? input.trim()
    if (!text || loading) return
    const userMessage = text
    const nextMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    const profile = metrics
      ? {
          readiness: metrics.readiness,
          hrv: metrics.hrv,
          restingHeartRate: metrics.restingHR,
          sleep: metrics.sleep ? `${metrics.sleep.hours}h ${metrics.sleep.minutes}m` : undefined,
          caloriesBurned: metrics.calories?.burned,
          trainingGoal: 'strength and performance',
        }
      : { readiness: 86, sleep: '7h 42m', restingHeartRate: 58, trainingGoal: 'strength and performance' }

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, profile }),
      })
      if (!response.ok || !response.body) throw new Error('Coach unavailable')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let answer = ''
      setMessages((current) => [...current, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        answer += decoder.decode(value, { stream: true })
        setMessages((current) => [...current.slice(0, -1), { role: 'assistant', content: answer }])
      }
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: "I couldn't reach the server right now. Please try again in a moment." },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="coach-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="SmartFit AI coach"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ animation: 'fadeIn .2s ease both' }}
    >
      <div className="coach-panel" style={{ animation: 'slideUp .35s cubic-bezier(.4,0,.2,1) both' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="icon-tile text-[#d6f36b]"><Sparkles size={16} /></div>
            <div>
              <p className="text-sm font-medium text-white">SmartFit coach</p>
              <p className="text-[11px] text-white/35">Personalized guidance</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/45 hover:text-white transition-colors" aria-label="Close coach">
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex min-h-[320px] flex-1 flex-col gap-3 overflow-y-auto p-5">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === 'user'
                  ? 'ml-auto bg-[#d6f36b] text-[#12150f]'
                  : 'bg-white/7 text-white/70'
              }`}
              style={{ animation: 'fadeInUp .25s ease both' }}
            >
              {message.content || <Loader2 className="animate-spin text-[#d6f36b]" size={16} />}
            </div>
          ))}
        </div>

        {/* Quick prompts (show when just the greeting is visible) */}
        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => submit(null, prompt)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/55 transition-colors hover:border-[#d6f36b]/30 hover:text-[#d6f36b]"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-4">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask your coach..."
            className="text-input flex-1"
            disabled={loading}
            autoFocus
          />
          <button
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#d6f36b] text-[#12150f] disabled:opacity-50 transition-transform hover:scale-105"
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <ArrowUp size={17} />}
          </button>
        </form>
      </div>
    </div>
  )
}
