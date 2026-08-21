export const STAGE_BOX = { x: -270, y: 140, width: 540, height: 100 } as const

/**
 * El escenario. Es referencia visual: no se selecciona y queda fuera del árbol
 * de accesibilidad salvo por su rótulo.
 */
export function Stage() {
  const { x, y, width, height } = STAGE_BOX
  return (
    <g>
      <path
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
        ESCENARIO
      </text>
    </g>
  )
}
