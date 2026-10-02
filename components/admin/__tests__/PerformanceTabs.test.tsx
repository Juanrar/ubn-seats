import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PerformanceTabs } from '@/components/admin/PerformanceTabs'

const SABADO = { id: 'a82bd4e0-937c-4af5-a5c8-259a7f942c68', startsAt: '2026-12-06T00:00:00+00:00' }
const LUNES = { id: 'b93ce5f1-a48d-4bf6-b6d9-36a8b053d79a', startsAt: '2026-12-08T00:00:00+00:00' }

describe('PerformanceTabs', () => {
  it('pone un link por función a su mapa', () => {
    render(<PerformanceTabs performances={[SABADO, LUNES]} selectedId={SABADO.id} />)

    expect(screen.getByRole('link', { name: 'Sáb 5/12' })).toHaveAttribute(
      'href',
      `/admin?funcion=${SABADO.id}`,
    )
    expect(screen.getByRole('link', { name: 'Lun 7/12' })).toHaveAttribute(
      'href',
      `/admin?funcion=${LUNES.id}`,
    )
  })

  it('marca la función elegida', () => {
    render(<PerformanceTabs performances={[SABADO, LUNES]} selectedId={LUNES.id} />)

    expect(screen.getByRole('link', { name: 'Lun 7/12' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Sáb 5/12' })).not.toHaveAttribute('aria-current')
  })
})
