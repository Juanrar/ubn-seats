import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Legend } from '@/components/Legend'

describe('Legend', () => {
  it('explica los cuatro estados en español', () => {
    render(<Legend />)
    for (const texto of ['Disponible', 'Seleccionada', 'Ocupada', 'Accesible']) {
      expect(screen.getByText(texto)).toBeInTheDocument()
    }
  })
})
