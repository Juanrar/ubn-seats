import { createServiceClient } from '@/utils/supabase/service'
import { refreshTokens } from '@/utils/mercadopago/oauth'
import type { ConnectedAccount } from '@/lib/mercadopago/oauth'

const TABLE = 'mercadopago_account'
const COLUMNS = 'mp_user_id, access_token, refresh_token, public_key, expires_at, connected_at'

export const REFRESH_MARGIN_MS = 5 * 60 * 1000

export class NoConnectedAccountError extends Error {
  constructor() {
    super('No hay una cuenta de Mercado Pago vinculada')
    this.name = 'NoConnectedAccountError'
  }
}

export interface StoredAccount extends ConnectedAccount {
  connectedAt: string
}

interface AccountRow {
  mp_user_id: string
  access_token: string
  refresh_token: string
  public_key: string | null
  expires_at: string
  connected_at: string
}

function toAccount(row: AccountRow): StoredAccount {
  return {
    mpUserId: row.mp_user_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    publicKey: row.public_key,
    expiresAt: Date.parse(row.expires_at),
    connectedAt: row.connected_at,
  }
}

export async function getConnectedAccount(): Promise<StoredAccount | null> {
  const { data, error } = await createServiceClient().from(TABLE).select(COLUMNS).maybeSingle()
  if (error) throw error
  return data ? toAccount(data as unknown as AccountRow) : null
}

export async function saveAccount(account: ConnectedAccount): Promise<void> {
  const { error } = await createServiceClient()
    .from(TABLE)
    .upsert({
      id: true,
      mp_user_id: account.mpUserId,
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      public_key: account.publicKey,
      expires_at: new Date(account.expiresAt).toISOString(),
      updated_at: new Date().toISOString(),
    })
  if (error) throw error
}

export async function disconnect(): Promise<void> {
  const { error } = await createServiceClient().from(TABLE).delete().eq('id', true)
  if (error) throw error
}

export async function requireAccessToken(): Promise<string> {
  const account = await getConnectedAccount()
  if (!account) throw new NoConnectedAccountError()

  if (account.expiresAt - Date.now() > REFRESH_MARGIN_MS) {
    return account.accessToken
  }

  const refreshed = await refreshTokens(account.refreshToken)
  await saveAccount(refreshed)
  return refreshed.accessToken
}
