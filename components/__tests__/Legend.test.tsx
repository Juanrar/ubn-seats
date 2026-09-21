import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Legend } from '@/components/Legend'
import { TEATRO_DEL_GLOBO } from '@/lib/plans/teatro-del-globo'

describe('Legend', () => {
  it('explica los cuatro estados en español', () => {
    render(<Legend geometry={TEATRO_DEL_GLOBO.geometry} />)
    for (const texto of ['Disponible', 'Seleccionada', 'Tuyas', 'Ocupada']) {
      expect(screen.getByText(texto)).toBeInTheDocument()
    }
  })
})
