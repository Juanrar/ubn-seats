import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeatSummaryBar } from '@/components/admin/SeatSummaryBar'

describe('SeatSummaryBar', () => {
  it('muestra cada cifra junto a su nombre', () => {
    render(<SeatSummaryBar summary={{ sold: 142, blocked: 18, free: 96 }} />)
    expect(screen.getByText('142').parentElement).toHaveTextContent(/vendidas/)
    expect(screen.getByText('18').parentElement).toHaveTextContent(/bloqueadas/)
    expect(screen.getByText('96').parentElement).toHaveTextContent(/libres/)
  })
})
