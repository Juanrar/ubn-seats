export interface Performance {
  id: string
  startsAt: string
}

export interface PerformanceParts {
  weekday: string
  weekdayShort: string
  day: number
  month: string
  monthShort: string
  time: string
}

const TIME_ZONE = 'America/Argentina/Buenos_Aires'

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const localDigits = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

function localNumbers(startsAt: string): Record<'year' | 'month' | 'day' | 'hour' | 'minute', number> {
  const parts = localDigits.formatToParts(new Date(startsAt))
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
  }
}

function formatTime(hour: number, minute: number): string {
  return minute === 0 ? `${hour} h` : `${hour}:${String(minute).padStart(2, '0')} h`
}

export function performanceParts(startsAt: string): PerformanceParts {
  const { year, month, day, hour, minute } = localNumbers(startsAt)
  const weekdayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return {
    weekday: WEEKDAYS[weekdayIndex],
    weekdayShort: WEEKDAYS_SHORT[weekdayIndex],
    day,
    month: MONTHS[month - 1],
    monthShort: MONTHS_SHORT[month - 1],
    time: formatTime(hour, minute),
  }
}

export function formatPerformanceDate(startsAt: string): string {
  const { weekday, day, month, time } = performanceParts(startsAt)
  return `${weekday} ${day} de ${month} · ${time}`
}

export function formatPerformanceShort(startsAt: string): string {
  const { weekdayShort, day } = performanceParts(startsAt)
  const { month } = localNumbers(startsAt)
  return `${weekdayShort} ${day}/${month}`
}

export function isOnSale(performance: Performance, now: number): boolean {
  return Date.parse(performance.startsAt) > now
}

export function isPerformanceId(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function defaultPerformance(performances: Performance[], now: number): Performance | null {
  const byStart = [...performances].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  return byStart.find((performance) => isOnSale(performance, now)) ?? byStart.at(-1) ?? null
}
