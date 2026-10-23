import { NextResponse } from 'next/server'
import { findUserById, getUserIdFromSession, deleteSession } from '@/lib/store'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sf_session')?.value
    if (!sessionId) return NextResponse.json({ user: null })

    const userId = getUserIdFromSession(sessionId)
    if (!userId) return NextResponse.json({ user: null })

    const user = findUserById(userId)
    if (!user) return NextResponse.json({ user: null })

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, profile: user.profile },
    })
  } catch (error) {
    console.error('[auth/me]', error)
    return NextResponse.json({ user: null })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sf_session')?.value
    if (sessionId) deleteSession(sessionId)

    const response = NextResponse.json({ success: true })
    response.cookies.delete('sf_session')
    return response
  } catch (error) {
    console.error('[auth/me DELETE]', error)
    return NextResponse.json({ error: 'Logout failed.' }, { status: 500 })
  }
}
