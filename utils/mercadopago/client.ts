import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

function config() {
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
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
}

export async function createPreference(params: CreatePreferenceParams): Promise<{ initPoint: string }> {
  const response = await new Preference(config()).create({
    body: {
      items: params.items,
      external_reference: params.orderId,
      notification_url: params.notificationUrl,
      back_urls: params.backUrls,
      auto_return: 'approved',
    },
  })

  if (!response.init_point) {
    throw new Error('Mercado Pago no devolvió init_point')
  }

  return { initPoint: response.init_point }
}

export async function getPayment(
  paymentId: string,
): Promise<{ status: string | undefined; externalReference: string | undefined }> {
  const response = await new Payment(config()).get({ id: paymentId })
  return { status: response.status, externalReference: response.external_reference }
}
