import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

function config(accessToken: string) {
  return new MercadoPagoConfig({ accessToken })
}

export interface PreferenceItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  currency_id: 'ARS'
}

export interface CreatePreferenceParams {
  orderId: string
  items: PreferenceItem[]
  notificationUrl: string
  backUrls: { success: string; pending: string; failure: string }
  accessToken: string
}

export const HOLD_MINUTES = 20

export async function createPreference(
  params: CreatePreferenceParams,
): Promise<{ initPoint: string; preferenceId: string }> {
  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString()

  const response = await new Preference(config(params.accessToken)).create({
    body: {
      items: params.items,
      external_reference: params.orderId,
      notification_url: params.notificationUrl,
      back_urls: params.backUrls,
      auto_return: 'approved',
      expires: true,
      expiration_date_to: expiresAt,
    },
  })

  if (!response.init_point) {
    throw new Error('Mercado Pago no devolvió init_point')
  }
  if (!response.id) {
    throw new Error('Mercado Pago no devolvió id')
  }

  return { initPoint: response.init_point, preferenceId: response.id }
}

export async function getPayment(
  paymentId: string,
  accessToken: string,
): Promise<{ status: string | undefined; externalReference: string | undefined }> {
  const response = await new Payment(config(accessToken)).get({ id: paymentId })
  return { status: response.status, externalReference: response.external_reference }
}
