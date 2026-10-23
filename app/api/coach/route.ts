import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are SmartFit's concise, supportive AI fitness coach.
Give safe, practical guidance for training, nutrition, recovery, and body composition.
Never diagnose medical conditions.
Encourage the user to consult a qualified professional for pain, injury, eating disorders, or urgent symptoms.
Personalize advice using the athlete profile provided.
Keep answers under 180 words unless the user explicitly asks for more detail.
Use a warm, motivating tone. Be direct and actionable.`

export async function POST(request: Request) {
  try {
    const { messages, profile } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    const systemWithProfile = profile
      ? `${SYSTEM_PROMPT}\n\nAthlete profile: ${JSON.stringify(profile)}`
      : SYSTEM_PROMPT

    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: systemWithProfile,
      messages,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[coach] error:', error)
    return NextResponse.json(
      { error: 'Coach is temporarily unavailable. Please try again.' },
      { status: 503 },
    )
  }
}
