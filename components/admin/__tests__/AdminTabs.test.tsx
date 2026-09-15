import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const pathname = vi.hoisted(() => ({ value: '/admin/ordenes' }))
vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }))

import { AdminTabs } from '@/components/admin/AdminTabs'

describe('AdminTabs', () => {
  it('muestra las tres pestañas con sus rutas', () => {
    render(<AdminTabs />)
    expect(screen.getByRole('link', { name: 'Butacas' })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: 'Órdenes' })).toHaveAttribute('href', '/admin/ordenes')
    expect(screen.getByRole('link', { name: 'Cuenta' })).toHaveAttribute('href', '/admin/cuenta')
  })

  it('marca sólo la pestaña de la ruta actual', () => {
    render(<AdminTabs />)
    expect(screen.getByRole('link', { name: 'Órdenes' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Butacas' })).not.toHaveAttribute('aria-current')
  })
})
