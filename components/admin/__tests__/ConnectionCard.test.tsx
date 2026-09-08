import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConnectionCard } from '@/components/admin/ConnectionCard'

vi.mock('@/app/admin/actions', () => ({ disconnectMercadoPago: vi.fn() }))

describe('ConnectionCard', () => {
  it('sin cuenta vinculada avisa que la venta está deshabilitada y ofrece conectar', () => {
    render(<ConnectionCard account={null} error={null} />)
    expect(screen.getByText(/la venta est[áa] deshabilitada/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /conectar mercado pago/i })).toHaveAttribute(
      'href',
      '/admin/mercadopago/start',
    )
  })

  it('con cuenta vinculada muestra el identificador y ofrece desconectar', () => {
    render(
      <ConnectionCard
        account={{ mpUserId: '123456789', connectedAt: '2026-09-08T12:00:00-03:00' }}
        error={null}
      />,
    )
    expect(screen.getByText(/123456789/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /desconectar/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /conectar mercado pago/i })).not.toBeInTheDocument()
  })

  it('muestra el motivo cuando la vinculación falló', () => {
    render(<ConnectionCard account={null} error="denied" />)
    expect(screen.getByRole('alert')).toHaveTextContent(/no autorizaste/i)
  })

  it('muestra un motivo genérico para un error desconocido', () => {
    render(<ConnectionCard account={null} error="vaya-a-saber" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
