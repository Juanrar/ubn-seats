// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { renderTicketPdf } from '@/utils/tickets/ticketPdf'

const background = readFileSync(join(process.cwd(), 'assets', 'tickets', '2026-12-05.jpg'))
const font = readFileSync(join(process.cwd(), 'assets', 'fonts', 'Barlow-SemiBold.ttf'))

describe('renderTicketPdf', () => {
  it('arma una página por butaca', async () => {
    const bytes = await renderTicketPdf({
      background,
      font,
      seats: [
        { row: 7, number: 11 },
        { row: 7, number: 12 },
      ],
    })

    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2)
  })

  it('cada página mide lo que la imagen impresa a 300 dpi', async () => {
    const bytes = await renderTicketPdf({ background, font, seats: [{ row: 16, number: 19 }] })
    const { width, height } = (await PDFDocument.load(bytes)).getPage(0).getSize()

    expect(width).toBeCloseTo(518.4)
    expect(height).toBeCloseTo(196.8)
  })

  it('falla si el fondo no es un JPG', async () => {
    await expect(
      renderTicketPdf({ background: new Uint8Array([1, 2, 3]), font, seats: [{ row: 7, number: 12 }] }),
    ).rejects.toThrow()
  })
})
