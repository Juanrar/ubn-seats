import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: { signOut: vi.fn() } }) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }))

import { PerformanceList } from '@/components/PerformanceList'
import { SHOW } from '@/lib/show'

const SABADO = { id: 'a82bd4e0-937c-4af5-a5c8-259a7f942c68', startsAt: '2026-12-06T00:00:00+00:00' }
const LUNES = { id: 'b93ce5f1-a48d-4bf6-b6d9-36a8b053d79a', startsAt: '2026-12-08T00:00:00+00:00' }

const renderList = (performances = [SABADO, LUNES], ticketCount = 0) =>
  render(
    <PerformanceList
      performances={performances}
      ticketCount={ticketCount}
      email="juanchilorenzo@gmail.com"
      avatarUrl={null}
    />,
  )

describe('PerformanceList', () => {
  it('muestra en la cabecera el acceso a Mis entradas con la cantidad', () => {
    renderList([SABADO, LUNES], 3)
    const cabecera = screen.getByRole('banner')

    expect(within(cabecera).getByRole('link', { name: 'Mis entradas, 3 entradas' })).toHaveAttribute(
      'href',
      '/mis-entradas',
    )
  })

  it('sin entradas no muestra en la cabecera el acceso a Mis entradas', () => {
    renderList([SABADO, LUNES], 0)
    const cabecera = screen.getByRole('banner')

    expect(within(cabecera).queryByRole('link', { name: /mis entradas/i })).not.toBeInTheDocument()
  })

  it('muestra el logo, la obra y la dirección', () => {
    renderList()
    expect(screen.getByRole('img', { name: /logo de la compañía/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: SHOW.title })).toBeInTheDocument()
    expect(screen.getByText(SHOW.address)).toBeInTheDocument()
  })

  it('lista cada función con un link a su selector', () => {
    renderList()
    const funciones = screen.getByRole('region', { name: 'Funciones' })
    const links = within(funciones).getAllByRole('link')

    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', `/funciones/${SABADO.id}`)
    expect(links[1]).toHaveAttribute('href', `/funciones/${LUNES.id}`)
  })

  it('nombra cada link con la fecha completa y la acción', () => {
    renderList()
    expect(
      screen.getByRole('link', { name: 'Sábado 5 de diciembre · 21 h. Ver disponibilidad' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Lunes 7 de diciembre · 21 h. Ver disponibilidad' }),
    ).toBeInTheDocument()
  })

  it('muestra la fecha grande, el día y la hora de cada función', () => {
    renderList([SABADO])
    const link = screen.getByRole('link', { name: /sábado 5 de diciembre/i })
    expect(within(link).getByText('5')).toBeInTheDocument()
    expect(within(link).getByText('dic')).toBeInTheDocument()
    expect(within(link).getByText('Sábado')).toBeInTheDocument()
    expect(within(link).getByText('21 h')).toBeInTheDocument()
    expect(within(link).getByText('Ver disponibilidad')).toBeInTheDocument()
  })

  it('sin funciones a la venta lo dice y no muestra links', () => {
    renderList([])
    const funciones = screen.getByRole('region', { name: 'Funciones' })
    expect(within(funciones).getByText('No hay funciones a la venta por ahora.')).toBeInTheDocument()
    expect(within(funciones).queryByRole('link')).not.toBeInTheDocument()
  })
})
