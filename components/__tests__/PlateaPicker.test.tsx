import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlateaPicker } from '@/components/PlateaPicker'
import { buildSeats } from '@/lib/seats'
import { buildOccupancy } from '@/lib/occupancy'
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

  it('mueve el foco con las flechas y selecciona con Enter', async () => {
    render(<PlateaPicker />)
    const mapa = screen.getByRole('group', { name: /mapa de butacas/i })
    let boton = screen.getAllByRole('button').find((b) => b.getAttribute('tabindex') === '0')!
    boton.focus()

    // El vecino inmediato puede caer ocupado según la semilla fija: se sigue
    // moviendo con la flecha hasta pisar una butaca libre antes de elegir.
    while (boton.getAttribute('aria-disabled') === 'true') {
      await userEvent.keyboard('{ArrowRight}')
      boton = document.activeElement as HTMLElement
    }
    await userEvent.keyboard('{Enter}')

    const resumen = screen.getByRole('region', { name: /tu selección/i })
    expect(within(resumen).getAllByRole('listitem')).toHaveLength(1)
    expect(mapa).toBeInTheDocument()
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
