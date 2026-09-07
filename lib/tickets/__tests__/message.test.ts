import { describe, it, expect } from 'vitest'
import { buildTicketEmail } from '@/lib/tickets/message'

const SEAT_IDS = ['platea-F07-12', 'platea-F07-11']

describe('buildTicketEmail', () => {
  it('titula el asunto con la obra y la cantidad de entradas', () => {
    const { subject } = buildTicketEmail({ seatIds: SEAT_IDS, amount: 5 })
    expect(subject).toBe('Tus 2 entradas para Función de prueba')
  })

  it('usa el singular cuando hay una sola butaca', () => {
    const { subject } = buildTicketEmail({ seatIds: ['platea-F07-12'], amount: 3 })
    expect(subject).toBe('Tu entrada para Función de prueba')
  })

  it('lista las butacas ordenadas por fila y número, con su franja', () => {
    const { text } = buildTicketEmail({ seatIds: SEAT_IDS, amount: 5 })
    expect(text).toContain('Fila 7, butaca 11, Platea B')
    expect(text).toContain('Fila 7, butaca 12, Platea B')
    expect(text.indexOf('butaca 11')).toBeLessThan(text.indexOf('butaca 12'))
  })

  it('anuncia la sala y el total pagado', () => {
    const { text } = buildTicketEmail({ seatIds: SEAT_IDS, amount: 5 })
    expect(text).toContain('Teatro del Globo')
    expect(text).toContain('$ 5')
  })

  it('ignora identificadores de butaca que no existen en la sala', () => {
    const { text } = buildTicketEmail({ seatIds: ['platea-F99-99', 'platea-F07-12'], amount: 3 })
    expect(text).toContain('butaca 12')
    expect(text).not.toContain('F99')
  })
})
