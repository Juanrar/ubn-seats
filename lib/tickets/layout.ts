import type { Seat } from '@/lib/types'

export interface FontMetrics {
  capHeightRatio: number
  widthOfTextAtSize(text: string, size: number): number
}

export interface PlacedValue {
  text: string
  x: number
  y: number
  size: number
  characterSpacing: number
}

export interface TicketPageLayout {
  width: number
  height: number
  values: PlacedValue[]
}

export interface Rgb {
  red: number
  green: number
  blue: number
}

const IMAGE_WIDTH_PX = 2160
const IMAGE_HEIGHT_PX = 820
const PRINT_DPI = 300
const POINTS_PER_INCH = 72
const PX_TO_PT = POINTS_PER_INCH / PRINT_DPI

const VALUE_COLUMN_CENTER_X_PX = 2013
const ROW_RULE_Y_PX = 403
const SEAT_RULE_Y_PX = 596
const GAP_BELOW_RULE_PX = 20
const VALUE_CAP_HEIGHT_PX = 25
const VALUE_TRACKING_EM = 0.12

export const TICKET_VALUE_COLOR: Rgb = { red: 189, green: 99, blue: 62 }

function placeUnderRule(text: string, ruleYPx: number, metrics: FontMetrics): PlacedValue {
  const size = (VALUE_CAP_HEIGHT_PX / metrics.capHeightRatio) * PX_TO_PT
  const characterSpacing = VALUE_TRACKING_EM * size
  const width = metrics.widthOfTextAtSize(text, size) + characterSpacing * (text.length - 1)
  const baselinePx = ruleYPx + GAP_BELOW_RULE_PX + VALUE_CAP_HEIGHT_PX

  return {
    text,
    x: VALUE_COLUMN_CENTER_X_PX * PX_TO_PT - width / 2,
    y: (IMAGE_HEIGHT_PX - baselinePx) * PX_TO_PT,
    size,
    characterSpacing,
  }
}

export function layoutTicketPage(seat: Pick<Seat, 'row' | 'number'>, metrics: FontMetrics): TicketPageLayout {
  return {
    width: IMAGE_WIDTH_PX * PX_TO_PT,
    height: IMAGE_HEIGHT_PX * PX_TO_PT,
    values: [
      placeUnderRule(String(seat.row), ROW_RULE_Y_PX, metrics),
      placeUnderRule(String(seat.number), SEAT_RULE_Y_PX, metrics),
    ],
  }
}
