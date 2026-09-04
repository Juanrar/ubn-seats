'use client'

import { createClient } from '@/utils/supabase/client'

const RIPPLE_DELAYS_MS = [0, 1300, 2600, 3900]
const RIPPLE_RISE = 138
const RIPPLE_RADIUS = 230
const RIPPLE_ARC = `M -218 75 A ${RIPPLE_RADIUS} ${RIPPLE_RADIUS} 0 0 1 218 75`

export function LoginScreen() {
  const handleLogin = () => {
    const supabase = createClient()
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="grid min-h-screen grid-cols-1 items-center gap-8 overflow-hidden px-6 py-16 md:grid-cols-2 md:gap-0 md:px-0 md:py-0">
      <div className="relative flex items-center justify-center">
        <svg
          data-login-ripples
          aria-hidden="true"
          viewBox="-260 -260 520 520"
          className="pointer-events-none absolute w-[520px] max-w-none"
        >
          <g fill="none" className="stroke-rule" strokeWidth={1} transform={`translate(0 -${RIPPLE_RISE})`}>
            {RIPPLE_DELAYS_MS.map((delay) => (
              <path
                key={delay}
                d={RIPPLE_ARC}
                className="login-ripple"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </g>
        </svg>
        <div role="img" aria-label="Logo de la compañía" className="login-mark relative" />
      </div>

      <div className="flex flex-col items-start gap-5 md:pr-24">
        <p
          className="login-rise font-mono text-[12px] tracking-[0.28em] text-ink-mute"
          style={{ animationDelay: '900ms' }}
        >
          TEATRO DEL GLOBO · PLATEA
        </p>
        <h1 className="login-rise text-hand-h1 font-bold" style={{ animationDelay: '1020ms' }}>
          Una butaca
          <br />a tu nombre
        </h1>
        <p
          className="login-rise max-w-[360px] text-hand-base text-pretty text-ink-mute"
          style={{ animationDelay: '1160ms' }}
        >
          Entrá con Google y guardá tu lugar en la platea.
        </p>
        <button
          type="button"
          onClick={handleLogin}
          className="login-rise flex min-h-[52px] items-center gap-3 rounded-sm bg-accent px-6 text-hand-base text-paper transition-colors hover:bg-accent-soft"
          style={{ animationDelay: '1300ms' }}
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a14 14 0 0 0 0 18a14 14 0 0 0 0 -18" />
            <path d="M3.6 8.5h16.8M3.6 15.5h16.8" />
          </svg>
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  )
}
