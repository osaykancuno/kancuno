// The K design: one JSON document that every K.LAB tool reads and writes.
import { BRAND, CANVAS, FIGURE_BOX, HEAD_DEFAULT, K1N0_PALETTE, onBar } from './base'
import { CAM_DEFAULT, type Cam } from './orbit'
import type { KImage } from './image'

export const DESIGN_VERSION = 1

export type PatternKind = 'stripes' | 'dots' | 'checker' | 'scan' | 'grid'
export type Fill =
  | { kind: 'solid'; a: string }
  | { kind: 'gradient'; a: string; b: string; angle: number }
  | { kind: 'pattern'; pattern: PatternKind; a: string; b: string; scale: number }

export interface PartStyle {
  visible: boolean
  fill: Fill
  line: boolean // draw as an outline (neon tube) instead of a solid shape
}

export type PartId = 'bg' | 'body' | 'head'

export const ANIM_LOOPS = ['pulse', 'bounce', 'float', 'wave', 'blink', 'spin', 'rain', 'glitch', 'scan'] as const
export type AnimLoop = (typeof ANIM_LOOPS)[number]

export interface KDesign {
  v: 1
  name: string
  form: 'vector' | 'pixel'
  view: '3d' | 'flat' // 3D: the clay figure of the site; flat: the 2D mark (SVG)
  bg: PartStyle
  body: PartStyle
  head: PartStyle & { cubes: string[]; useFill: boolean } // per-square colours unless useFill
  fx: {
    glow: number // 0..1 neon glow
    glitch: number // 0..1 RGB split + slices
    pixel: number // 0..1 pixelate
    grain: number // 0..1 texture
    scan: number // 0..1 CRT scanlines
    depth: number // 0..1 shadow strength (3D) / offset shadow (flat)
    seed: number
  }
  grid: { size: number; gap: number; cells: string[] } // Pixel Forge: size*size cells, '' = empty
  anim: { loops: AnimLoop[]; period: number } // Animation Bench, period in seconds
  cam: Cam // 3D view: where the visitor turned the K to (exports keep it)
  img: KImage | null // Image Wrap: a picture printed on the 3D K (vector form only)
}

export const GRID_SIZES = [24, 32, 48, 64] as const
// Head pitch in cells per grid size (even, so the brick offset is a whole cell)
const PITCH: Record<number, number> = { 24: 4, 32: 4, 48: 6, 64: 8 }

const solid = (a: string): Fill => ({ kind: 'solid', a })
// Palette colours too dark to sit behind the ink X (it would vanish into them)
const DARK: readonly string[] = [BRAND.ink, '#1d2a6b', '#6b3e26']
/** The colour moved toward black (light colours) or white (dark ones) by k, for quiet backgrounds */
function shade(hex: string, k: number): string {
  const v = parseInt(hex.slice(1), 16)
  const rgb = [(v >> 16) & 255, (v >> 8) & 255, v & 255]
  const light = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 140
  const to = light ? 0 : 255
  return '#' + rgb.map(c => Math.round(c + (to - c) * k).toString(16).padStart(2, '0')).join('')
}
const part = (fill: Fill, extra: Partial<PartStyle> = {}): PartStyle => ({ visible: true, line: false, fill, ...extra })

// The K as true pixel art on a size x size grid. Point-sampling the vector loses the
// 1-unit gaps between head squares, so the head is built on whole cells instead:
// squares (k-1) wide with a 1-cell gap, rows touching, the brick offset exactly k/2.
// Only the X is sampled from the vector form (4x4 supersampling per cell).
const gridCache = new Map<string, string[]>()
export function presetGrid(size: number, cubes: string[] = HEAD_DEFAULT, body: string = BRAND.ink): string[] {
  const key = `${size}|${cubes.join()}|${body}`
  let grid = gridCache.get(key)
  if (!grid) {
    grid = buildGrid(size, cubes, body)
    if (gridCache.size > 64) gridCache.clear()
    gridCache.set(key, grid)
  }
  return grid.slice()
}

function buildGrid(size: number, cubes: string[], body: string): string[] {
  const out: string[] = new Array(size * size).fill('')
  const k = PITCH[size] ?? Math.max(2, 2 * Math.round(size / 16)) // head pitch in cells
  const w = k - 1 // square side in cells
  const fx = k / 12 // cells per canvas unit, horizontally
  const fy = (3 * w) / 30 // cells per canvas unit, vertically (head height 30 → 3 squares)
  const top = Math.round((size - FIGURE_BOX.h * fy) / 2)
  const headLeft = Math.round((size - (3 * k - 1)) / 2)
  const cx = headLeft + (3 * k - 1) / 2 // the X is centred under the head, as in the artwork
  const set = (x: number, y: number, c: string) => {
    if (x >= 0 && y >= 0 && x < size && y < size) out[y * size + x] = c
  }
  // X: supersampled coverage
  const S = 4
  for (let gy = 0; gy < size; gy++) {
    for (let gx = 0; gx < size; gx++) {
      let hit = 0
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const ux = CANVAS / 2 + (gx + (sx + 0.5) / S - cx) / fx
          const uy = FIGURE_BOX.y + (gy + (sy + 0.5) / S - top) / fy
          if (onBar(ux, uy)) hit++
        }
      }
      if (hit / (S * S) >= 0.42) set(gx, gy, body)
    }
  }
  // Head: two, three, two
  const cols = [[1, 3], [0, 2, 4], [1, 3]] // in half-pitch steps
  let i = 0
  cols.forEach((row, r) => {
    row.forEach(c => {
      const x0 = headLeft + (c * k) / 2
      const y0 = top + r * w
      for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) set(x0 + x, y0 + y, cubes[i])
      i++
    })
  })
  return out
}


export function defaultDesign(): KDesign {
  return {
    v: 1,
    name: 'Original K',
    form: 'vector',
    view: '3d',
    bg: part(solid(BRAND.yellow)),
    body: part(solid(BRAND.ink)),
    head: { ...part(solid(BRAND.ink)), cubes: [...HEAD_DEFAULT], useFill: false },
    fx: { glow: 0, glitch: 0, pixel: 0, grain: 0, scan: 0, depth: 0, seed: 8362 },
    grid: { size: 32, gap: 0, cells: presetGrid(32) },
    anim: { loops: [], period: 2.4 },
    cam: { ...CAM_DEFAULT },
    img: null,
  }
}

type Patch = {
  name: string
  form?: KDesign['form']
  view?: KDesign['view']
  bg?: Partial<PartStyle>
  body?: Partial<PartStyle>
  head?: Partial<KDesign['head']>
  fx?: Partial<KDesign['fx']>
  anim?: Partial<KDesign['anim']>
  grid?: Partial<KDesign['grid']>
}

export function makeDesign(p: Patch): KDesign {
  const d = defaultDesign()
  const head = { ...d.head, ...p.head }
  return {
    ...d,
    name: p.name,
    form: p.form ?? d.form,
    view: p.view ?? d.view,
    bg: { ...d.bg, ...p.bg },
    body: { ...d.body, ...p.body },
    head,
    fx: { ...d.fx, ...p.fx },
    anim: { ...d.anim, ...p.anim },
    grid: p.grid ? { ...d.grid, ...p.grid } : { ...d.grid, cells: presetGrid(d.grid.size, head.cubes, (p.body?.fill?.kind === 'solid' && p.body.fill.a) || BRAND.ink) },
  }
}

// Starting points (themes). Names are generic on purpose: the Lab is about the K, not other communities.
export const PRESETS: KDesign[] = [
  defaultDesign(),
  makeDesign({
    name: 'Night K',
    bg: { fill: solid(BRAND.ink) },
    body: { fill: solid(BRAND.yellow) },
    head: { cubes: [BRAND.yellow, BRAND.yellow, BRAND.yellow, BRAND.purple, BRAND.yellow, BRAND.pink, BRAND.pink] },
  }),
  makeDesign({
    name: 'Neon K',
    bg: { fill: solid('#07060b') },
    body: { line: true, fill: solid('#ff4fd8') },
    head: { line: true, cubes: ['#3ff2ff', '#3ff2ff', '#3ff2ff', '#ff4fd8', '#3ff2ff', BRAND.yellow, BRAND.yellow] },
    fx: { glow: 0.75 },
    anim: { loops: ['pulse'] },
  }),
  makeDesign({
    name: 'Minimal',
    bg: { fill: solid(BRAND.cream) },
    body: { fill: solid(BRAND.ink) },
    head: { cubes: [BRAND.ink, BRAND.ink, BRAND.ink, BRAND.yellow, BRAND.ink, BRAND.ink, BRAND.ink] },
  }),
  makeDesign({
    name: 'Cyber',
    bg: { fill: { kind: 'gradient', a: '#1b1430', b: '#07060b', angle: 90 } },
    body: { fill: { kind: 'gradient', a: '#3ff2ff', b: '#2f6bff', angle: 120 } },
    head: { cubes: ['#2f6bff', '#2f6bff', '#2f6bff', '#ff4fd8', '#2f6bff', '#3ff2ff', '#3ff2ff'] },
    fx: { glitch: 0.45, scan: 0.5, glow: 0.25 },
    anim: { loops: ['glitch', 'scan'] },
  }),
  makeDesign({
    name: 'Coffee',
    bg: { fill: solid('#d9b38c') },
    body: { fill: solid('#3a2116') },
    head: { cubes: ['#3a2116', '#3a2116', '#3a2116', '#fff6dc', '#3a2116', '#6b3e26', '#6b3e26'] },
    fx: { grain: 0.55, depth: 0.5 },
  }),
  // The clay K with pixel rain falling around it (the pixel form strays too far from the figure)
  makeDesign({
    name: 'Pixel Rain',
    bg: { fill: solid(BRAND.purple) },
    head: { cubes: [BRAND.ink, BRAND.ink, BRAND.ink, BRAND.yellow, BRAND.ink, '#3ff2ff', '#3ff2ff'] },
    anim: { loops: ['rain'] },
  }),
  makeDesign({
    name: '1-Bit',
    bg: { fill: { kind: 'pattern', pattern: 'checker', a: '#ffffff', b: '#e6e6e6', scale: 4 } },
    body: { fill: solid('#111111') },
    head: { cubes: ['#111111', '#111111', '#111111', '#ffffff', '#111111', '#111111', '#111111'] },
    fx: { pixel: 0.3 },
  }),
  makeDesign({
    name: 'Blueprint',
    bg: { fill: { kind: 'pattern', pattern: 'grid', a: '#2f6bff', b: '#5d8dff', scale: 5 } },
    body: { line: true, fill: solid('#ffffff') },
    head: { line: true, cubes: Array(7).fill('#ffffff') },
  }),
  makeDesign({
    name: 'Sunset',
    bg: { fill: { kind: 'gradient', a: '#ff7a1a', b: '#ff4fd8', angle: 90 } },
    body: { fill: solid('#1b1430') },
    head: { useFill: true, fill: { kind: 'gradient', a: BRAND.yellow, b: '#ff3b30', angle: 90 } },
    fx: { depth: 0.6 },
    anim: { loops: ['float', 'spin'] },
  }),
]

// Structural copy: every nested object/array the tools write to is fresh, strings are shared.
// Much cheaper than a JSON round trip on every slider tick (a 64x64 grid is 4096 cells).
const copyFill = (f: Fill): Fill => ({ ...f })
export const cloneDesign = (d: KDesign): KDesign => ({
  ...d,
  bg: { ...d.bg, fill: copyFill(d.bg.fill) },
  body: { ...d.body, fill: copyFill(d.body.fill) },
  head: { ...d.head, fill: copyFill(d.head.fill), cubes: d.head.cubes.slice() },
  fx: { ...d.fx },
  grid: { ...d.grid, cells: d.grid.cells.slice() },
  anim: { ...d.anim, loops: d.anim.loops.slice() },
  cam: { ...(d.cam ?? CAM_DEFAULT) },
  img: d.img ? { ...d.img } : null,
})

// Random remix that keeps the K recognisable: the silhouette and the head pattern never change
export function remix(d: KDesign, rand: () => number = Math.random): KDesign {
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rand() * a.length)]
  // Like a K1N0: the X and four head blocks stay ink, so the figure always reads as the K.
  // The background is never a dark colour that would swallow the ink X.
  const ink = BRAND.ink
  const pal = K1N0_PALETTE.filter(c => c !== ink) // remixes stay mintable as they are
  const bgc = pick(pal.filter(c => !DARK.includes(c)))
  const acc1 = pick(pal.filter(c => c !== bgc))
  const acc2 = pick(pal.filter(c => c !== bgc && c !== acc1))
  // gradients and patterns only shade the background colour, so they never compete with the figure
  const bgFill: Fill = rand() < 0.5 ? solid(bgc) : rand() < 0.5
    ? { kind: 'gradient', a: bgc, b: shade(bgc, 0.22), angle: pick([0, 45, 90, 135]) }
    : { kind: 'pattern', pattern: pick(['stripes', 'dots', 'scan', 'grid'] as const), a: bgc, b: shade(bgc, 0.12), scale: pick([4, 6, 8]) }
  const out = cloneDesign(d)
  out.name = 'Remix ' + Math.floor(rand() * 9000 + 1000)
  out.bg = { ...out.bg, visible: true, fill: bgFill }
  out.body = { ...out.body, visible: true, line: false, fill: solid(ink) }
  out.head = { ...out.head, visible: true, line: false, useFill: false, cubes: [ink, ink, ink, acc2, ink, acc1, acc1] }
  out.fx = {
    ...out.fx,
    glow: rand() < 0.2 ? 0.4 : 0,
    glitch: rand() < 0.15 ? 0.3 : 0,
    pixel: 0, // pixelation is a choice in the editor, never a random one
    grain: rand() < 0.25 ? 0.4 : 0,
    scan: rand() < 0.15 ? 0.5 : 0,
    depth: rand() < 0.3 ? 0.5 : 0,
    seed: Math.floor(rand() * 1e6),
  }
  return out
}
