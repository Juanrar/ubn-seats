import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendTicketEmail } from '@/utils/email/client'

const ATTACHMENT = { name: 'entrada.png', contentBase64: 'aGVsbG8=' }

function params() {
  return {
    to: 'compradora@correo.test',
    subject: 'Tu entrada',
    text: 'Fila 7, butaca 12',
    html: '<p>Fila 7, butaca 12</p>',
    attachments: [ATTACHMENT],
  }
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status })
}

beforeEach(() => {
  process.env.BREVO_API_KEY = 'clave-de-prueba'
  process.env.TICKET_FROM_EMAIL = 'entradas@teatro.test'
  process.env.TICKET_FROM_NAME = 'Teatro del Globo'
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('sendTicketEmail', () => {
  it('postea el mensaje a Brevo con la clave y el remitente configurados', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(201, { messageId: 'abc' }))

    await sendTicketEmail(params())

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect((init!.headers as Record<string, string>)['api-key']).toBe('clave-de-prueba')

    const body = JSON.parse(init!.body as string)
    expect(body.sender).toEqual({ email: 'entradas@teatro.test', name: 'Teatro del Globo' })
    expect(body.to).toEqual([{ email: 'compradora@correo.test' }])
    expect(body.subject).toBe('Tu entrada')
    expect(body.textContent).toBe('Fila 7, butaca 12')
    expect(body.htmlContent).toBe('<p>Fila 7, butaca 12</p>')
  })

  it('adjunta los archivos en base64', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(201, { messageId: 'abc' }))

    await sendTicketEmail(params())

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.attachment).toEqual([{ name: 'entrada.png', content: 'aGVsbG8=' }])
  })

  it('falla si Brevo rechaza el envío', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(400, { message: 'sender no verificado' }))

    await expect(sendTicketEmail(params())).rejects.toThrow('sender no verificado')
  })

  it('falla si falta la clave de Brevo', async () => {
    delete process.env.BREVO_API_KEY

    await expect(sendTicketEmail(params())).rejects.toThrow('BREVO_API_KEY')
    expect(fetch).not.toHaveBeenCalled()
  })
})
