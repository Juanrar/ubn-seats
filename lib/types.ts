export type SectorId =
  | 'platea'
  | 'platea-ala-izq'
  | 'platea-ala-der'
  | 'platea-accesible'

export type SeatKind = 'standard' | 'accessible'

export type SeatStatus = 'available' | 'occupied' | 'selected'

export interface Seat {
  id: string
  sector: SectorId
  row: number
  number: number
  kind: SeatKind
  price: number
  tier: string
  label: string
  x: number
  y: number
  angle: number
}

export interface GeometryPlan {
  seatWidth: number
  seatHeight: number
  seatPitch: number
  rowPitch: number
  firstRowRadius: number
  center: { x: number; y: number }
  aisleGap: number
  wingInnerOffset: number
}

export interface RowPlan {
  row: number
  center: number
  wing: number
  accessible: boolean
}

export interface TierPlan {
  label: string
  price: number
  throughRow?: number
}

export interface CenterBlockPlan {
  sector: SectorId
  tiers: TierPlan[]
}

export interface WingsPlan {
  leftSector: SectorId
  rightSector: SectorId
  leftStartNumber: number
  rightStartNumber: number
  tier: TierPlan
}

export interface AccessiblePlan {
  sector: SectorId
  tier: TierPlan
}

export interface StagePlan {
  x: number
  y: number
  width: number
  height: number
  label: string
}

export interface VenuePlan {
  id: string
  name: string
  sectionName: string
  geometry: GeometryPlan
  stage: StagePlan
  rows: RowPlan[]
  centerBlock: CenterBlockPlan
  wings: WingsPlan
  accessible: AccessiblePlan
  framePadding: number
}
