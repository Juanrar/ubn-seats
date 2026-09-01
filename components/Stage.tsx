import type { StagePlan } from '@/lib/types'

export interface StageProps {
  stage: StagePlan
}

export function Stage({ stage }: StageProps) {
  const { x, y, width, height, label } = stage
  return (
    <g>
      <path
        aria-hidden="true"
        d={`M ${x} ${y + height} L ${x} ${y + 18} Q ${x} ${y} ${x + 22} ${y}
            L ${x + width - 22} ${y} Q ${x + width} ${y} ${x + width} ${y + 18}
            L ${x + width} ${y + height} Z`}
        className="fill-paper-2 stroke-rule"
        strokeWidth={1}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        textAnchor="middle"
        className="fill-ink-soft font-mono text-[13px] tracking-[0.35em]"
      >
        {label}
      </text>
    </g>
  )
}
