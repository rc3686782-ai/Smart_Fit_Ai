import { NextResponse } from 'next/server'
import { findUserByEmail, createSession, hashPassword } from '@/lib/store'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body ?? {}

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = findUserByEmail(email.toLowerCase().trim())
    if (!user) {
      return NextResponse.json({ error: 'No account found with that email.' }, { status: 401 })
    }

    const hash = await hashPassword(password)
    if (hash !== user.passwordHash) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
    }

    const sessionId = createSession(user.id)

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, profile: user.profile },
    })

    response.cookies.set('sf_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[auth/login]', error)
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 })
  }
}
