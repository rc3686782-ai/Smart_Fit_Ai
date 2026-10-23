import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserIdFromSession, findUserById, updateUserProfile } from '@/lib/store'

async function getUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sf_session')?.value
  if (!sessionId) return null
  const userId = getUserIdFromSession(sessionId)
  if (!userId) return null
  return findUserById(userId) ?? null
}

/** GET /api/profile — returns full profile */
export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    return NextResponse.json({
      user: {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        createdAt: user.createdAt,
        profile:   user.profile ?? {},
      },
    })
  } catch (error) {
    console.error('[profile GET]', error)
    return NextResponse.json({ error: 'Failed to fetch profile.' }, { status: 500 })
  }
}

/** PATCH /api/profile — update profile fields */
export async function PATCH(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const body = await request.json()

    // Merge incoming fields with existing profile (don't wipe unrelated fields)
    const updated = updateUserProfile(user.id, {
      ...user.profile,
      ...body,
    })

    if (!updated) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    return NextResponse.json({
      success: true,
      profile: updated.profile,
    })
  } catch (error) {
    console.error('[profile PATCH]', error)
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 })
  }
}
