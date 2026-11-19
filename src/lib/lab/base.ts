// The K base form: the flat K4NCUN0 mark, measured from the flat logo artwork
// (head squares 11x10 on a 12-unit pitch, the X made of two capsules at ±36°).
// Everything lives on a 100x100 canvas with the figure's visual centre at 50,50.
// Plain numbers only: this module must never import three.js (the Lab bundle stays light).

export const CANVAS = 100
export const CENTER = 50

// Head squares, back row first (draw order). Colour roles map to the default palette.
export const HEAD_W = 11
export const HEAD_H = 10
export const HEAD = [
  { x: 38.5, y: 23, row: 0 },
  { x: 50.5, y: 23, row: 0 },
  { x: 32.5, y: 33, row: 1 },
  { x: 44.5, y: 33, row: 1 },
  { x: 56.5, y: 33, row: 1 },
  { x: 38.5, y: 43, row: 2 },
  { x: 50.5, y: 43, row: 2 },
] as const

// The X: two capsules crossing at (50, 63), behind the head
export const BAR = { cx: 50, cy: 63, length: 44, thickness: 7.75, angle: 36 } as const

// Figure bounding box (used for gradients and patterns that span the figure)
export const FIGURE_BOX = { x: 30.5, y: 23, w: 39, h: 54 } as const
export const HEAD_BOX = { x: 32.5, y: 23, w: 35, h: 30 } as const

export const BRAND = {
  yellow: '#fbc500',
  ink: '#0f0d0a',
  pink: '#fc98ca',
  purple: '#9559bb',
  cream: '#fff6dc',
} as const

// The head of THE K.LAB's mark (the starting K1N0): pink centre, lime front blocks. The K4NCUN0
// logo (purple centre, pink fronts) is K1N0 #0, the artist's own piece, not the Lab's base.
export const HEAD_DEFAULT = [BRAND.ink, BRAND.ink, BRAND.ink, BRAND.pink, BRAND.ink, '#c8f04a', '#c8f04a']

// The K1N0 palette: the 16 colours a minted K can use (stored in the KLab contract, same order).
// Brand first; any two are clearly apart (ΔE2000 ≥ 14), so no two K1N0 differ by a mere shade.
// The tools offer these swatches; any other colour still works in the Lab, and is matched to
// the nearest of these when minting.
export const K1N0_PALETTE = [
  BRAND.yellow, BRAND.ink, BRAND.pink, BRAND.purple, BRAND.cream, '#7a7468', '#3ff2ff', '#2f6bff',
  '#27e07a', '#ff3b30', '#ff7a1a', '#6b3e26', '#d9b38c', '#ff4fd8', '#1d2a6b', '#c8f04a',
] as const
export const SWATCHES: readonly string[] = K1N0_PALETTE

// Inside tests for the vector form (canvas units), used to rasterise the K onto a pixel grid
export function headIndexAt(px: number, py: number): number {
  // front rows win, as they are drawn last
  for (let i = HEAD.length - 1; i >= 0; i--) {
    const h = HEAD[i]
    if (px >= h.x && px <= h.x + HEAD_W && py >= h.y && py <= h.y + HEAD_H) return i
  }
  return -1
}

export function onBar(px: number, py: number): boolean {
  const r = BAR.thickness / 2
  const half = BAR.length / 2 - r
  for (const s of [1, -1]) {
    const a = (s * BAR.angle * Math.PI) / 180
    const dx = px - BAR.cx
    const dy = py - BAR.cy
    const u = dx * Math.cos(a) + dy * Math.sin(a)
    const v = -dx * Math.sin(a) + dy * Math.cos(a)
    const cu = Math.max(-half, Math.min(half, u))
    if (Math.hypot(u - cu, v) <= r) return true
  }
  return false
}
