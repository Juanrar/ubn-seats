import { describe, it, expect } from 'vitest'
import {
  defaultPerformance,
  formatPerformanceDate,
  formatPerformanceShort,
  isOnSale,
  isPerformanceId,
  performanceParts,
  type Performance,
} from '@/lib/performance'

const SABADO = '2026-12-06T00:00:00+00:00'
const LUNES = '2026-12-08T00:00:00+00:00'

const funcion = (id: string, startsAt: string): Performance => ({ id, startsAt })

describe('performanceParts', () => {
  it('lee la fecha en hora de Argentina aunque en UTC ya sea el día siguiente', () => {
    expect(performanceParts(SABADO)).toEqual({
      weekday: 'Sábado',
      weekdayShort: 'Sáb',
      day: 5,
      month: 'diciembre',
      monthShort: 'dic',
      time: '21 h',
    })
  })

  it('muestra los minutos cuando la función no empieza en punto', () => {
    expect(performanceParts('2026-12-06T00:30:00+00:00').time).toBe('21:30 h')
  })

  it('arma el día de la semana a partir de la fecha local', () => {
    expect(performanceParts(LUNES).weekday).toBe('Lunes')
    expect(performanceParts('2026-12-02T23:00:00+00:00').weekday).toBe('Miércoles')
  })
})

describe('formatPerformanceDate', () => {
  it('escribe día, fecha y hora', () => {
    expect(formatPerformanceDate(SABADO)).toBe('Sábado 5 de diciembre · 21 h')
    expect(formatPerformanceDate(LUNES)).toBe('Lunes 7 de diciembre · 21 h')
  })
})

describe('formatPerformanceShort', () => {
  it('abrevia el día de la semana y agrega día y mes', () => {
    expect(formatPerformanceShort(SABADO)).toBe('Sáb 5/12')
    expect(formatPerformanceShort(LUNES)).toBe('Lun 7/12')
  })
})

describe('isOnSale', () => {
  const start = Date.parse(SABADO)

  it('vende hasta un instante antes de empezar', () => {
    expect(isOnSale(funcion('a', SABADO), start - 1)).toBe(true)
  })

  it('deja de vender a la hora de inicio', () => {
    expect(isOnSale(funcion('a', SABADO), start)).toBe(false)
    expect(isOnSale(funcion('a', SABADO), start + 1)).toBe(false)
  })
})

describe('isPerformanceId', () => {
  it('acepta un UUID', () => {
    expect(isPerformanceId('a82bd4e0-937c-4af5-a5c8-259a7f942c68')).toBe(true)
    expect(isPerformanceId('A82BD4E0-937C-4AF5-A5C8-259A7F942C68')).toBe(true)
  })

  it('rechaza lo que no tiene forma de UUID', () => {
    expect(isPerformanceId('sabado')).toBe(false)
    expect(isPerformanceId('a82bd4e0-937c-4af5-a5c8-259a7f942c68x')).toBe(false)
    expect(isPerformanceId('')).toBe(false)
  })
})

describe('defaultPerformance', () => {
  const sabado = funcion('sab', SABADO)
  const lunes = funcion('lun', LUNES)

  it('elige la próxima a la venta aunque la lista venga desordenada', () => {
    expect(defaultPerformance([lunes, sabado], Date.parse('2026-12-01T00:00:00Z'))).toBe(sabado)
  })

  it('salta las que ya empezaron', () => {
    expect(defaultPerformance([sabado, lunes], Date.parse(SABADO))).toBe(lunes)
  })

  it('elige la última si ya pasaron todas', () => {
    expect(defaultPerformance([lunes, sabado], Date.parse('2027-01-01T00:00:00Z'))).toBe(lunes)
  })

  it('devuelve null sin funciones', () => {
    expect(defaultPerformance([], Date.parse(SABADO))).toBeNull()
  })
})
