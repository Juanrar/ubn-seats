---
target: components/PlateaPicker.tsx
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 3
p1_count: 2
timestamp: 2026-09-01T14-48-54Z
slug: components-plateapicker-tsx
---
Method: dual-agent (A: design review, B: detector + build evidence)

# Critique — components/PlateaPicker.tsx (Platea seat picker)

Mode: Operate. The visitor's job: read the room, find seats they'd want at a price they'll accept, commit.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Hitting the cap is a silent no-op; toggle returns prev, seat doesn't react, limitReached is below the fold on mobile |
| 2 | Match System / Real World | 3 | Copy is excellent rioplatense, but the map shows neither rows nor price zones |
| 3 | User Control and Freedom | 2 | "Vaciar" destroys up to 8 selections, no confirm, no undo |
| 4 | Consistency and Standards | 3 | Prices use text-xs/text-base outside the --text-hand-* ramp; role="button" in role="group" where grid/gridcell fits |
| 5 | Error Prevention | 1 | Nothing prevents the 9th seat or the occupied click; cap stated only in empty state and after the fact |
| 6 | Recognition Rather Than Recall | 1 | Price only in a hover-delayed native title element and in the panel after commitment |
| 7 | Flexibility and Efficiency | 2 | nextSeatId doesn't skip occupied seats; ~1 in 3 arrow presses hits a dead cell. No "2 juntas" affordance |
| 8 | Aesthetic and Minimalist Design | 3 | Paper-and-ink restraint is the best asset; minimalism landed on data density rather than chrome |
| 9 | Error Recovery | 1 | No error states; aria-live announces state, never rejection |
| 10 | Help and Documentation | 3 | One good hint line, placed after map and legend, no aria-describedby |
| **Total** | | **21/40** | **Needs work** |

No heuristics n/a — all ten apply to a purchase surface.

## Design Specificity Verdict

Half-authored. The skin is specific; the information design is category-interchangeable.

The aesthetic is a defended position (#f1e8d3 paper, Caveat 500, custom size ramp, "Escenario" in sentence case) and lib/plans/teatro-del-globo.ts encodes the real house (wings from row 6, row 16 without a centre block, wingInnerOffset held constant so the wing column stays plumb). But strip the palette and what remains is the default seat-picker wireframe. The specificity lib/venue/ computes never reaches the screen: four tiers spanning 45.000 to 24.000 (a 2x spread), every seat's row and number — and SeatMap.tsx draws two labelled things: the stage and 302 identical rects. CLAUDE.md promises an "etiqueta" that was never drawn.

Deterministic scan: detect.mjs --json on components and app returned zero findings, exit 0. Assessment B validated this (re-ran with --no-config, confirmed no ignore rules in .impeccable/config.json, and confirmed the detector flags a deliberately-bad control file). Caveat: the control file tripped only 1 of ~6 planted defects — TSX coverage is regex-shallow. Zero findings means "no rule matched", not "clean". No false positives to discount.

Visual overlays: skipped, no browser automation tool exposed. No overlay is visible in the browser.

Supporting evidence: npm run typecheck exit 0 clean; npm run test:run exit 0, 146/146 tests across 14 files.

## Overall Impression

A beautifully engineered room with nothing written on the walls. The lib/ pipeline is genuinely deep — useSeatPicker owns the whole state machine including the roving-tabindex trap, leaving PlateaPicker.tsx as 63 lines of layout. Then everything the venue knows is thrown away at the component boundary. Biggest opportunity: draw the data you already have. Row numbers, tier boundaries and price on the map fix the worst three heuristic scores at once.

## What's Working

1. The state machine is a real deep module. useSeatPicker concentrates selection, cap, logical focus, real DOM focus (pendingFocus + CSS.escape), keys, ordering, total. selectedSeats sorts by row then number, so the panel reads in the order a person walks the room, not click order.
2. The plan-as-data seam produces geometry about this theatre: per-seat rotation toward the centre of curvature, wingInnerOffset held constant so rows 15-16 don't bend the wing inward.
3. The typographic system is a position defended down to the numbers: Caveat's low x-height compensated with a paired size/line-height ramp; JetBrains Mono reserved for figures where column alignment is functional.

## Priority Issues

### [P0] Price and row are invisible on the map — the buying decision can't be made there
Why it matters: Seat.price, .tier, .row and .number all exist on every seat and none are drawn; Legend explains status, never price. A picker where you can't see prices is a lottery, and it makes the monochrome constraint read as an excuse rather than a position.
Fix: row numbers at both ends of each arc (text-ink-mute, ~11px); a 1px rule arc at the 5/6 and 10/11 tier boundaries with "Platea A - 45.000" beside it; encode tier by stroke-weight or a mark in the seat back rather than hue; replace the ~1s native title delay with an inline plaque on hover/focus ("F07 - 12 - Platea B - 38.000"), keeping the title element for AT.
Command: /impeccable layout, then /impeccable typeset

### [P0] The cap and the occupied click both fail in total silence
Why it matters: toggle returns prev unchanged at maxSeats and returns early for occupied seats — no signal at the point of interaction; limitReached renders below map, legend and hint on mobile. A click with no response reads as breakage, not as a rule. Screen-reader users get nothing: the live region reports count and total, never a rejection.
Fix: (a) surface the cap continuously ("3 de 8" beside "Tu seleccion" from the first seat); (b) return a reason from toggle ('ocupada' or 'tope') and render it inline near the map plus aria-live assertive ("Ya elegiste 8 butacas. Quita una para elegir otra."); (c) at the cap, restyle unselected available seats to stroke-rule-soft and cursor-not-allowed — prevention rather than recovery.
Command: /impeccable harden, then /impeccable clarify

### [P0] Mobile is functionally broken: ~12px targets and a gesture that blocks its own scroll
Why it matters: SeatMap.tsx:19 sets touch-pan-y on the svg whose parent (PlateaPicker.tsx:32) is overflow-x-auto with a min-w-[560px] child. touch-action pan-y makes the browser ignore horizontal drags over the SVG — on a phone the map cannot be dragged sideways, so the wings and the left of the room are unreachable. seatWidth 20 in a ~588-unit viewBox at 560px renders each seat at roughly 12 x 10 CSS px against a 24px minimum. CONTEXT.md's "sin pinch-zoom propio" decision leans on that scroll container working.
Fix: drop touch-pan-y (or use touch-pan-x touch-pan-y) and verify a horizontal drag on a real device; add a transparent hit-expansion rect per seat at seatPitch x rowPitch so the tap target reaches ~24px while the drawn seat stays 20x17.
Command: /impeccable adapt

### [P1] The composition has no ending, and hierarchy inverts at the money
Why it matters: SelectionPanel.tsx:83-84 sets the word "Total" at text-hand-lead (24px) and the amount at font-mono text-base (16px); per-seat prices are text-xs (12px) — the smallest text on a page whose body ramp starts at 18px is the number the user is buying on. And there is no primary action anywhere, so the panel builds visual weight toward a button that doesn't exist.
Fix: total at ~28-32px mono, label down to text-hand-sm text-ink-mute, per-seat prices to 15-16px; add a full-width "Continuar" below the total, disabled with a reason when empty. Even with checkout out of scope, the composition needs a foot.
Command: /impeccable layout

### [P1] "Vaciar" is unguarded, undoable, and the panel's only verb
Why it matters: one click wipes up to 8 decisions, from the top of the panel at the moment of highest investment, with 12px targets on a phone. It is also the only button in the summary region, which teaches the user that this screen's purpose is to accumulate and discard.
Fix: retain the previous set for one action, swap the control to "Deshacer" for ~8 seconds with an aria-live note, and demote it below the new primary CTA.
Command: /impeccable harden

## Persona Red Flags

Screen-reader user (NVDA, Spanish): 302 role="button" elements inside a role="group" give no row/column model — no table navigation, no "fila 7, columna 12". nextSeatId never skips occupied seats, so ~1 in 3 arrow presses lands on a dead cell that answers Enter with nothing. The live region announces an aggregate ("3 butacas seleccionadas. Total $ 113.000.") and never which seat changed. aria-pressed true collides with an aria-label already ending in ", seleccionada" — state spoken twice in two vocabularies. The keyboard hint is an orphan paragraph with no aria-describedby on the svg.

Mobile / thumb user: blocked horizontal drag-scroll makes the wings unreachable; ~12 x 10px adjacent targets with a 4px gap make mis-taps the default; the panel stacks after map, legend and hint, so the total, the cap warning and Vaciar are all off-screen during the entire act of selecting; lg:sticky lg:top-8 applies only at the breakpoint where sticky matters least.

Older, low-vision theatregoer (the actual audience): a 12px monospace price is the number they came for. Occupied seats are fill-rule-soft (#ddd2b4 on #f1e8d3, roughly 1.1:1) so "taken" is nearly invisible, inverting the intended reading. 1px hairlines on 20x17 shapes make the map read as texture rather than discrete objects. No row numbers means no way to reason about distance from the stage. The focus ring is a 2px accent stroke on an already brownish outline. --font-prose (Lora) is declared and entirely unused — no reader-friendly escape hatch.

## Minor Observations

- MAX_SEATS = 8, not 6 (lib/constants.ts). The copy interpolates maxSeats correctly, so the brief is what's stale; confirm product truth.
- tracking-[0.24em] on "Escenario" letterspaces a connected script.
- Legend sits after the map — the key arrives after the thing it decodes.
- formatTotal renders "$ 113.000" while formatPrice omits the sign; the panel shows a bare 38.000 per seat and $ 113.000 at the foot.
- The hint paragraph is permanent, shown to mouse users who will never press an arrow key.
- ThemeToggle spends the header's top-right on an appearance preference, as three simultaneous choices.
- No motion anywhere but transition-colors; the design has no vocabulary for "no".
- Fixed 35% seeded occupancy: the demo is always a third-full house. Near-empty and near-sold-out are the two states that stress this design hardest and neither is reachable.
- platea-tipografia-caveat.html at the repo root is an 11k-line bundled artifact, untracked and not on CLAUDE.md's do-not-commit list.

## Questions to Consider

1. If the map can't show price, why is it a map?
2. Does "nunca por color" have the courage of its convictions? The constraint removed the cheap solution without supplying the expensive one.
3. What does this paper make when you say no?
4. Whose 8 seats are these? The real intent is "cuatro juntas, no muy atras, menos de 40.000".
