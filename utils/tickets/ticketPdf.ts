import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb, setCharacterSpacing, type PDFFont, type PDFPage } from 'pdf-lib'
import { layoutTicketPage, TICKET_VALUE_COLOR, type PlacedValue } from '@/lib/tickets/layout'
import type { Seat } from '@/lib/types'

export interface TicketPdfInput {
  background: Uint8Array
  font: Uint8Array
  seats: Pick<Seat, 'row' | 'number'>[]
}

const CHANNEL_MAX = 255

const VALUE_COLOR = rgb(
  TICKET_VALUE_COLOR.red / CHANNEL_MAX,
  TICKET_VALUE_COLOR.green / CHANNEL_MAX,
  TICKET_VALUE_COLOR.blue / CHANNEL_MAX,
)

function drawValue(page: PDFPage, font: PDFFont, value: PlacedValue): void {
  page.pushOperators(setCharacterSpacing(value.characterSpacing))
  page.drawText(value.text, { x: value.x, y: value.y, size: value.size, font, color: VALUE_COLOR })
  page.pushOperators(setCharacterSpacing(0))
}

export async function renderTicketPdf({ background, font, seats }: TicketPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const embeddedFont = await pdf.embedFont(font, { subset: true })
  const image = await pdf.embedJpg(background)
  const { capHeight, unitsPerEm } = fontkit.create(font)
  const metrics = {
    capHeightRatio: capHeight / unitsPerEm,
    widthOfTextAtSize: (text: string, size: number) => embeddedFont.widthOfTextAtSize(text, size),
  }

  for (const seat of seats) {
    const layout = layoutTicketPage(seat, metrics)
    const page = pdf.addPage([layout.width, layout.height])
    page.drawImage(image, { x: 0, y: 0, width: layout.width, height: layout.height })
    layout.values.forEach((value) => drawValue(page, embeddedFont, value))
  }

  return pdf.save()
}
