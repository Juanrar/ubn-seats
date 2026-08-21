import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlateaPicker } from '@/components/PlateaPicker'
import { buildSeats } from '@/lib/seats'
import { buildOccupancy } from '@/lib/occupancy'
import { nextSeatId } from '@/lib/navigation'
import { MAX_SEATS } from '@/lib/constants'

const seats = buildSeats()
const occupied = buildOccupancy(seats)
const libre = (n = 0) =>
  seats.filter((s) => s.kind === 'standard' && !occupied.has(s.id))[n]

const botonDe = (id: string) => {
  const seat = seats.find((s) => s.id === id)!
  const nombre =
    seat.sector === 'platea-accesible'
      ? new RegExp(`Fila ${seat.row}, espacio accesible ${seat.number}`)
      : new RegExp(`Fila ${seat.row}, butaca ${seat.number},`)
  return screen.getAllByRole('button', { name: nombre })[0]
}

describe('PlateaPicker', () => {
  it('al elegir una butaca aparece en el resumen y suma al total', async () => {
    render(<PlateaPicker />)
    const seat = libre()
    await userEvent.click(botonDe(seat.id))

    const resumen = screen.getByRole('region', { name: /tu selección/i })
    expect(within(resumen).getByText(new RegExp(`Fila ${seat.row}`))).toBeInTheDocument()
    // Se ignora el párrafo sr-only del aria-live: repite el mismo texto "$ "
    // que la fila de Total visible y produciría un match múltiple.
    expect(within(resumen).getByText(/\$ /, { ignore: '.sr-only' })).toBeInTheDocument()
  })

  it('al volver a tocarla se deselecciona', async () => {
    render(<PlateaPicker />)
    const seat = libre()
    await userEvent.click(botonDe(seat.id))
    await userEvent.click(botonDe(seat.id))
    expect(screen.getByText(/eleg[íi] tus butacas/i)).toBeInTheDocument()
  })

  it('quitar desde el panel deselecciona en el mapa', async () => {
    render(<PlateaPicker />)
    const seat = libre()
    await userEvent.click(botonDe(seat.id))
    await userEvent.click(screen.getByRole('button', { name: /^quitar fila/i }))
    expect(screen.getByText(/eleg[íi] tus butacas/i)).toBeInTheDocument()
  })

  it('no deja pasar del tope y lo avisa', async () => {
    render(<PlateaPicker />)
    for (let i = 0; i < MAX_SEATS + 2; i++) {
      await userEvent.click(botonDe(libre(i).id))
    }
    // Se acota a la región del resumen: la Leyenda también usa <li> para sus
    // ítems y contaminaría un conteo global.
    const resumen = screen.getByRole('region', { name: /tu selección/i })
    expect(within(resumen).getAllByRole('listitem')).toHaveLength(MAX_SEATS)
    // También se ignora el sr-only: repite "8 butacas seleccionadas" y
    // colisiona con el aviso de tope.
    expect(
      screen.getByText(new RegExp(`${MAX_SEATS} butacas`, 'i'), { ignore: '.sr-only' }),
    ).toBeInTheDocument()
  })

  it('no permite seleccionar una butaca ocupada', async () => {
    render(<PlateaPicker />)
    const ocupada = seats.find((s) => occupied.has(s.id))!
    await userEvent.click(botonDe(ocupada.id))
    expect(screen.getByText(/eleg[íi] tus butacas/i)).toBeInTheDocument()
  })

  it('mueve el foco real del DOM con las flechas', async () => {
    render(<PlateaPicker />)
    const inicial = screen.getAllByRole('button').find((b) => b.getAttribute('tabindex') === '0')!
    inicial.focus()
    const idInicial = inicial.getAttribute('data-seat-id')!
    const idEsperado = nextSeatId(seats, idInicial, 'right')
    // Sanity: si esto fallara, el resto del test no probaría nada.
    expect(idEsperado).not.toBe(idInicial)

    const anterior = document.activeElement
    await userEvent.keyboard('{ArrowRight}')

    expect(document.activeElement).not.toBe(anterior)
    expect(document.activeElement).toBe(
      document.querySelector(`[data-seat-id="${idEsperado}"]`),
    )
  })

  it('selecciona con Enter la butaca a la que se llegó con la flecha, no la de partida', async () => {
    render(<PlateaPicker />)
    const inicial = screen.getAllByRole('button').find((b) => b.getAttribute('tabindex') === '0')!
    inicial.focus()
    const idInicial = inicial.getAttribute('data-seat-id')!

    // Se calcula de antemano cuántas flechas hacen falta para llegar a una
    // butaca libre distinta de la de partida: la ocupación depende de la
    // semilla fija, así que el vecino inmediato podría estar ocupado.
    let id = idInicial
    const teclas: string[] = []
    do {
      const next = nextSeatId(seats, id, 'right')
      if (next === id) throw new Error('sin butacas libres a la derecha para probar Enter')
      id = next
      teclas.push('{ArrowRight}')
    } while (occupied.has(id))
    const seatEsperado = seats.find((s) => s.id === id)!

    await userEvent.keyboard(teclas.join('') + '{Enter}')

    const resumen = screen.getByRole('region', { name: /tu selección/i })
    expect(within(resumen).getAllByRole('listitem')).toHaveLength(1)
    expect(within(resumen).getByText(new RegExp(`Fila ${seatEsperado.row}`))).toBeInTheDocument()
  })

  it('mantiene una sola parada de tabulación después de navegar', async () => {
    render(<PlateaPicker />)
    const primera = screen.getAllByRole('button').find((b) => b.getAttribute('tabindex') === '0')!
    primera.focus()
    await userEvent.keyboard('{ArrowDown}{ArrowRight}')
    const alcanzables = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('tabindex') === '0')
    expect(alcanzables).toHaveLength(1)
  })

  it('muestra la leyenda de estados', () => {
    render(<PlateaPicker />)
    expect(screen.getByText('Disponible')).toBeInTheDocument()
    expect(screen.getByText('Accesible')).toBeInTheDocument()
  })
})
