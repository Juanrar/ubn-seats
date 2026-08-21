import { describe, it, expect } from 'vitest'

describe('arnés de tests', () => {
  it('corre en jsdom con document disponible', () => {
    expect(typeof document).toBe('object')
  })

  it('tiene los matchers de jest-dom cargados', () => {
    const el = document.createElement('div')
    el.textContent = 'hola'
    document.body.appendChild(el)
    expect(el).toBeInTheDocument()
  })
})
