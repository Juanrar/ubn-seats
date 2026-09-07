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
    description:
      'Las butacas no quedaron reservadas. Si te llegó un cargo, escribinos y lo resolvemos.',
  },
}

const ORDER_STATUS_COPY: Record<string, PaymentResultCopy> = {
  confirmed: COPY.exito,
  pending: COPY.pendiente,
  cancelled: COPY.error,
  paid_without_seats: {
    heading: 'Cobramos el pago, pero las butacas ya no estaban',
    description:
      'Alguien las tomó antes de que se acreditara. No te quedó ninguna butaca reservada: escribinos y te devolvemos la plata.',
  },
}

export function orderStatusCopy(status: string): PaymentResultCopy {
  return ORDER_STATUS_COPY[status] ?? COPY.pendiente
}

export function isPaymentResult(value: string): value is PaymentResult {
  return value in COPY
}

export function paymentResultCopy(result: PaymentResult): PaymentResultCopy {
  return COPY[result]
}
