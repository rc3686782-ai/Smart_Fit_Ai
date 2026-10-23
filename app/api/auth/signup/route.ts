import { NextResponse } from 'next/server'
import { findUserByEmail, saveUser, createSession, hashPassword } from '@/lib/store'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body ?? {}

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()

    // Check duplicate
    if (findUserByEmail(emailLower)) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
    }

    const id = crypto.randomUUID()
    const passwordHash = await hashPassword(password)
    const user = {
      id,
      name: name.trim(),
      email: emailLower,
      passwordHash,
      createdAt: new Date().toISOString(),
    }

    saveUser(user)

    const sessionId = createSession(id)

    const response = NextResponse.json({
      success: true,
      user: { id, name: user.name, email: emailLower },
    })

    response.cookies.set('sf_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[auth/signup]', error)
    return NextResponse.json({ error: 'Sign-up failed. Please try again.' }, { status: 500 })
  }
}
