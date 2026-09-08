'use client'

import { useActionState } from 'react'
import { signIn, type SignInState } from '@/app/admin/actions'

const INITIAL: SignInState = { error: null }

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(signIn, INITIAL)

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-hand-h2 font-bold">Panel</h1>
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-hand-base font-medium">
          Contraseña
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            className="border-b border-rule bg-transparent py-2 text-hand-base font-medium outline-none focus-visible:border-accent"
          />
        </label>
        {state.error ? (
          <p role="alert" className="text-hand-sm text-ink-mute">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="self-start border border-rule px-4 py-2 text-hand-base font-medium disabled:opacity-50"
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
