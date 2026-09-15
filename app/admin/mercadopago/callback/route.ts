import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { timingSafeEqual } from 'node:crypto'
import { exchangeCodeForTokens } from '@/utils/mercadopago/oauth'
import { saveAccount } from '@/utils/mercadopago/account'
import { OAUTH_STATE_COOKIE, verifySessionToken } from '@/lib/admin/session'

function backToAccount(error?: string): NextResponse {
  const url = new URL('/admin/cuenta', process.env.SITE_URL!)
  if (error) url.searchParams.set('error', error)
  return NextResponse.redirect(url)
}

function statesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const store = await cookies()
  const expected = store.get(OAUTH_STATE_COOKIE)?.value
  const received = request.nextUrl.searchParams.get('state')
  const secret = process.env.ADMIN_SESSION_SECRET

  store.delete({ name: OAUTH_STATE_COOKIE, path: '/admin' })

  if (!secret) {
    return backToAccount('state')
  }
  if (!expected || !received || !statesMatch(expected, received)) {
    return backToAccount('state')
  }
  if (!(await verifySessionToken(secret, 'oauth', received, Date.now()))) {
    return backToAccount('state')
  }
  if (request.nextUrl.searchParams.get('error')) {
    return backToAccount('denied')
  }

  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return backToAccount('exchange')
  }

  try {
    const account = await exchangeCodeForTokens(
      code,
      `${process.env.SITE_URL}/admin/mercadopago/callback`,
    )
    await saveAccount(account)
  } catch {
    return backToAccount('exchange')
  }

  return backToAccount()
}
