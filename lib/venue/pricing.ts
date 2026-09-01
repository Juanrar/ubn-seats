import type { SectorId, TierPlan, VenuePlan } from '@/lib/types'

export function tierFor(plan: VenuePlan, sector: SectorId, row: number): TierPlan {
  if (sector === plan.wings.leftSector || sector === plan.wings.rightSector) {
    return plan.wings.tier
  }
  const match = plan.centerBlock.tiers.find(
    (tier) => tier.throughRow === undefined || row <= tier.throughRow,
  )
  if (!match) throw new Error(`El plano no define franja para la fila ${row}`)
  return match
}
