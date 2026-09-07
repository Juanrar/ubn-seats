import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { readTicketAttachment } from '@/utils/tickets/attachment'

let directory: string

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'ticket-'))
})

afterEach(() => {
  rmSync(directory, { recursive: true, force: true })
  delete process.env.TICKET_IMAGE_PATH
})

describe('readTicketAttachment', () => {
  it('devuelve el archivo configurado en base64, con su nombre', async () => {
    const path = join(directory, 'entrada.png')
    writeFileSync(path, 'hello')
    process.env.TICKET_IMAGE_PATH = path

    expect(await readTicketAttachment()).toEqual({ name: 'entrada.png', contentBase64: 'aGVsbG8=' })
  })

  it('falla si el archivo de la entrada no existe', async () => {
    process.env.TICKET_IMAGE_PATH = join(directory, 'no-esta.png')

    await expect(readTicketAttachment()).rejects.toThrow()
  })
})
