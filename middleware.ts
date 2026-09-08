import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin/session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && pathname !== '/admin/login') {
    const token = request.cookies.get(ADMIN_COOKIE)?.value
    const secret = process.env.ADMIN_SESSION_SECRET
    if (!secret || !token || !(await verifySessionToken(secret, 'session', token, Date.now()))) {
      const login = request.nextUrl.clone()
      login.pathname = '/admin/login'
      login.search = ''
      return NextResponse.redirect(login)
    }
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
