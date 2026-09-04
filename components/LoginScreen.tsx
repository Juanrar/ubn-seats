'use client'

import { createClient } from '@/utils/supabase/client'

export function LoginScreen() {
  const handleLogin = () => {
    const supabase = createClient()
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[var(--layout-stack)] flex-col items-center justify-center gap-6 px-5 text-center">
      <h1 className="text-hand-h2 font-bold">Teatro del Globo — Platea</h1>
      <p className="text-hand-base text-ink-mute">
        Iniciá sesión con Google para ver la disponibilidad de butacas y reservar.
      </p>
      <button
        type="button"
        onClick={handleLogin}
        className="rounded-sm bg-accent px-6 py-3 text-hand-base text-paper hover:bg-accent-soft"
      >
        Iniciar sesión con Google
      </button>
    </div>
  )
}
