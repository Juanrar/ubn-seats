import { getConnectedAccount } from '@/utils/mercadopago/account'
import { ConnectionCard } from '@/components/admin/ConnectionCard'
import { signOut } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const account = await getConnectedAccount()

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-8 px-6 py-12">
      <header className="flex items-baseline justify-between">
        <h1 className="text-hand-h1 font-bold">Panel</h1>
        <form action={signOut}>
          <button type="submit" className="text-hand-sm font-medium text-ink-mute underline">
            Salir
          </button>
        </form>
      </header>

      <ConnectionCard
        account={
          account ? { mpUserId: account.mpUserId, connectedAt: account.connectedAt } : null
        }
        error={error ?? null}
      />
    </main>
  )
}
