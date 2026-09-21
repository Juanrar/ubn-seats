import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { resendTicket } = vi.hoisted(() => ({ resendTicket: vi.fn() }))
vi.mock('@/app/mis-entradas/actions', () => ({ resendTicket }))

import { TicketCard } from '@/components/TicketCard'
import { SHOW } from '@/lib/show'

const TICKET = {
  orderId: 'o1',
  seats: [
    { id: 'platea-F07-12', label: 'Fila 7, butaca 12, Platea B' },
    { id: 'platea-F07-13', label: 'Fila 7, butaca 13, Platea B' },
  ],
  total: '$ 76.000',
}

beforeEach(() => {
  vi.clearAllMocks()
  resendTicket.mockResolvedValue({ ok: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TicketCard', () => {
  it('muestra la función, las butacas y el total', () => {
    render(<TicketCard ticket={TICKET} />)

    expect(screen.getByText(SHOW.title)).toBeInTheDocument()
    expect(screen.getByText('Fila 7, butaca 12, Platea B')).toBeInTheDocument()
    expect(screen.getByText('Fila 7, butaca 13, Platea B')).toBeInTheDocument()
    expect(screen.getByText('$ 76.000')).toBeInTheDocument()
  })

  it('enlaza la descarga a la ruta de la orden', () => {
    render(<TicketCard ticket={TICKET} />)

    expect(screen.getByRole('link', { name: /descargar/i })).toHaveAttribute(
      'href',
      '/api/entradas/o1',
    )
  })

  it('reenvía el mail y lo anuncia', async () => {
    const user = userEvent.setup()
    render(<TicketCard ticket={TICKET} />)

    await user.click(screen.getByRole('button', { name: /reenviar/i }))

    await waitFor(() => expect(resendTicket).toHaveBeenCalledWith('o1'))
    expect(await screen.findByText(/te lo enviamos/i)).toBeInTheDocument()
  })

  it('muestra el error si el reenvío falla', async () => {
    resendTicket.mockResolvedValue({ ok: false, message: 'No pudimos enviar el mail.' })
    const user = userEvent.setup()
    render(<TicketCard ticket={TICKET} />)

    await user.click(screen.getByRole('button', { name: /reenviar/i }))

    expect(await screen.findByText('No pudimos enviar el mail.')).toBeInTheDocument()
  })

  it('tiene una región viva siempre presente en el árbol', () => {
    render(<TicketCard ticket={TICKET} />)

    const region = document.querySelector('[aria-live="polite"]')
    expect(region).toBeInTheDocument()
    expect(region).toBeEmptyDOMElement()
  })

  it('deshabilita el botón mientras se está enviando', async () => {
    let resolveResend: (result: { ok: false; message: string }) => void = () => {}
    resendTicket.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveResend = resolve
        }),
    )
    const user = userEvent.setup()
    render(<TicketCard ticket={TICKET} />)

    const button = screen.getByRole('button', { name: /reenviar/i })
    await user.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Enviando…')

    resolveResend({ ok: false, message: 'No pudimos enviar el mail.' })
    await waitFor(() => expect(button).not.toBeDisabled())
  })

  it('vuelve a habilitarse y a mostrar el texto original después de 60 segundos', async () => {
    vi.useFakeTimers()
    render(<TicketCard ticket={TICKET} />)
    const button = screen.getByRole('button', { name: /reenviar/i })

    await act(async () => {
      fireEvent.click(button)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(button).toHaveTextContent('Enviado')
    expect(button).toBeDisabled()

    await act(async () => {
      vi.advanceTimersByTime(60000)
    })

    expect(button).toHaveTextContent('Reenviar al mail')
    expect(button).not.toBeDisabled()
  })
})
