const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

export interface EmailAttachment {
  name: string
  contentBase64: string
}

export interface TicketEmailParams {
  to: string
  subject: string
  text: string
  attachments: EmailAttachment[]
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`)
  }
  return value
}

export async function sendTicketEmail({ to, subject, text, attachments }: TicketEmailParams): Promise<void> {
  const apiKey = required('BREVO_API_KEY')
  const senderEmail = required('TICKET_FROM_EMAIL')
  const senderName = required('TICKET_FROM_NAME')

  const response = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to }],
      subject,
      textContent: text,
      attachment: attachments.map((attachment) => ({
        name: attachment.name,
        content: attachment.contentBase64,
      })),
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Brevo rechazó el envío (${response.status}): ${detail}`)
  }
}
