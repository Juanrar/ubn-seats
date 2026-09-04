export type PaymentResult = 'exito' | 'pendiente' | 'error'

export interface PaymentResultCopy {
  heading: string
  description: string
}

const COPY: Record<PaymentResult, PaymentResultCopy> = {
  exito: {
    heading: '¡Reserva confirmada!',
    description: 'Tu pago se acreditó y las butacas quedaron a tu nombre.',
  },
  pendiente: {
    heading: 'Estamos confirmando tu pago',
    description: 'Puede tardar unos minutos. Te avisamos apenas se acredite.',
  },
  error: {
    heading: 'No se pudo procesar el pago',
    description: 'No te cobramos nada. Volvé a intentar cuando quieras.',
  },
}

export function isPaymentResult(value: string): value is PaymentResult {
  return value in COPY
}

export function paymentResultCopy(result: PaymentResult): PaymentResultCopy {
  return COPY[result]
}
