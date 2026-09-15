import { signOut } from '@/app/admin/actions'
import { ConnectionCard } from '@/components/admin/ConnectionCard'
import { SECONDARY_BUTTON } from '@/components/admin/buttons'
import { getConnectedAccount, type StoredAccount } from '@/utils/mercadopago/account'

export const dynamic = 'force-dynamic'

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  let account: StoredAccount | null = null
  let accountUnknown = false
  try {
    account = await getConnectedAccount()
  } catch {
    accountUnknown = true
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-6">
      <h1 className="text-hand-h1 font-bold">Cuenta</h1>
      {accountUnknown ? (
        <p role="alert" className="text-hand-base text-ink-mute">
          No se pudo leer la cuenta de Mercado Pago. Recargá la página.
        </p>
      ) : (
        <ConnectionCard
          account={account ? { mpUserId: account.mpUserId, connectedAt: account.connectedAt } : null}
          error={error ?? null}
        />
      )}
      <form action={signOut} className="border-t border-rule pt-4">
        <button type="submit" className={`${SECONDARY_BUTTON} w-full`}>
          Salir del panel
        </button>
      </form>
    </main>
  )
}
