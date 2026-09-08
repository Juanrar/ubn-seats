import { disconnectMercadoPago } from '@/app/admin/actions'

export interface ConnectionCardAccount {
  mpUserId: string
  connectedAt: string
}

const REASONS: Record<string, string> = {
  state: 'La vinculación venció o vino de un lugar inesperado. Probá de nuevo.',
  denied: 'No autorizaste el acceso en Mercado Pago.',
  exchange: 'Mercado Pago rechazó la vinculación. Probá de nuevo.',
}

const GENERIC_REASON = 'No se pudo vincular la cuenta. Probá de nuevo.'

export function ConnectionCard({
  account,
  error,
}: {
  account: ConnectionCardAccount | null
  error: string | null
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-rule pt-4">
      <h2 className="text-hand-h2 font-bold">Mercado Pago</h2>

      {error ? (
        <p role="alert" className="text-hand-sm text-ink-mute">
          {REASONS[error] ?? GENERIC_REASON}
        </p>
      ) : null}

      {account ? (
        <>
          <p className="text-hand-base font-medium">
            Cuenta vinculada <span className="font-mono text-[13px]">{account.mpUserId}</span>
          </p>
          <p className="text-hand-sm text-ink-mute">
            Desde el{' '}
            {new Date(account.connectedAt).toLocaleDateString('es-AR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <form action={disconnectMercadoPago}>
            <button
              type="submit"
              className="border border-rule px-4 py-2 text-hand-base font-medium"
            >
              Desconectar cuenta
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="text-hand-base font-medium">
            No hay ninguna cuenta vinculada, así que la venta está deshabilitada.
          </p>
          <a
            href="/admin/mercadopago/start"
            className="self-start border border-rule px-4 py-2 text-hand-base font-medium"
          >
            Conectar Mercado Pago
          </a>
        </>
      )}
    </section>
  )
}
