// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { buildTicketAttachment } from '@/utils/tickets/attachment'

const SABADO = { id: 'perf-sab', startsAt: '2026-12-06T00:00:00+00:00' }
const SIN_FONDO = { id: 'perf-ene', startsAt: '2027-01-10T00:00:00+00:00' }

async function pageCount(contentBase64: string): Promise<number> {
  return (await PDFDocument.load(Buffer.from(contentBase64, 'base64'))).getPageCount()
}

describe('buildTicketAttachment', () => {
  it('arma un PDF nombrado con la fecha de la función', async () => {
    const attachment = await buildTicketAttachment(SABADO, ['platea-F07-12'])

    expect(attachment.name).toBe('entradas-ubn-2026-12-05.pdf')
    expect(Buffer.from(attachment.contentBase64, 'base64').subarray(0, 5).toString()).toBe('%PDF-')
  })

  it('suma una página por butaca', async () => {
    const attachment = await buildTicketAttachment(SABADO, [
      'platea-F07-12',
      'platea-F07-11',
      'platea-ala-izq-F16-19',
    ])

    expect(await pageCount(attachment.contentBase64)).toBe(3)
  })

  it('deja afuera las butacas que no están en el plano', async () => {
    const attachment = await buildTicketAttachment(SABADO, ['platea-F07-12', 'platea-F99-1'])

    expect(await pageCount(attachment.contentBase64)).toBe(1)
  })

  it('falla si ninguna butaca está en el plano', async () => {
    await expect(buildTicketAttachment(SABADO, ['platea-F99-1'])).rejects.toThrow()
  })

  it('falla si la función no tiene fondo cargado', async () => {
    await expect(buildTicketAttachment(SIN_FONDO, ['platea-F07-12'])).rejects.toThrow()
  })
})
