import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { buildAuthorizationUrl } from '@/lib/mercadopago/oauth'
import { createSessionToken, OAUTH_STATE_COOKIE, STATE_MINUTES } from '@/lib/admin/session'

const STATE_MS = STATE_MINUTES * 60 * 1000

export async function GET() {
  const secret = process.env.ADMIN_SESSION_SECRET
  const origin = process.env.SITE_URL!

  if (!secret) {
    return NextResponse.redirect(new URL('/admin?error=config', origin))
  }

  const state = await createSessionToken(secret, 'oauth', Date.now() + STATE_MS)

  const store = await cookies()
  store.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: STATE_MS / 1000,
  })

  return NextResponse.redirect(
    buildAuthorizationUrl({
      clientId: process.env.MP_CLIENT_ID!,
      redirectUri: `${origin}/admin/mercadopago/callback`,
      state,
    }),
  )
}
