import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Teatro del Globo — Platea',
  description: 'Selección de butacas del sector Platea del Teatro del Globo.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
