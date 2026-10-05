import type { NextConfig } from 'next'

const TICKET_ASSETS = ['./assets/**/*']

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/entradas/*': TICKET_ASSETS,
    '/api/mercadopago/webhook': TICKET_ASSETS,
    '/mis-entradas': TICKET_ASSETS,
  },
}

export default nextConfig
