import { NextResponse } from 'next/server'
import { getUserIdFromSession, findUserById, updateUserProfile } from '@/lib/store'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sf_session')?.value
    const profile = await request.json()

    if (sessionId) {
      const userId = getUserIdFromSession(sessionId)
      if (userId) {
        const updated = updateUserProfile(userId, profile)
        if (updated) {
          return NextResponse.json({ success: true, profile: updated.profile })
        }
      }
    }

    // Guest mode — profile returned but not persisted
    return NextResponse.json({ success: true, profile, guest: true })
  } catch (error) {
    console.error('[onboarding]', error)
    return NextResponse.json({ error: 'Could not save profile.' }, { status: 500 })
  }
}
