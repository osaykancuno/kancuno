// K1N0 (v2) codec: a K design of the Lab ↔ what the KLab contract stores. A K1N0 is the clay K:
// the X and four blocks of the head always black, and four colours of its own (palette indices):
// background, centre block, front left and front right blocks; plus a look the holder can change
// (an effect per colour, speed, 3D view).
// Pure and dependency-free (type imports only), shared by the site and the contract tests.
import type { KDesign } from './design'

export const MAX_SUPPLY = 8362
export const MINT_PRICE_ETH = '0.0024' // the contract's starting price (the mint dialog reads the live one)
export const LOGO_ID = 0 // K1N0 #0: the K4NCUN0 logo, minted to the artist with the contract

// The K1N0 palette, same order as KLab.PALETTE and base.ts K1N0_PALETTE
export const K1N0 = [
  '#fbc500', '#0f0d0a', '#fc98ca', '#9559bb', '#fff6dc', '#7a7468', '#3ff2ff', '#2f6bff',
  '#27e07a', '#ff3b30', '#ff7a1a', '#6b3e26', '#d9b38c', '#ff4fd8', '#1d2a6b', '#c8f04a',
]
export const NAMES = ['Yellow', 'Ink', 'Pink', 'Purple', 'Cream', 'Grey', 'Cyan', 'Blue', 'Green', 'Red', 'Orange', 'Brown', 'Tan', 'Magenta', 'Navy', 'Lime']
export const INK = 1
export const SLOTS = ['Background', 'Centre', 'Front left', 'Front right'] as const
export const HEAD_FX = ['None', 'Glow', 'Pulse', 'Blink', 'Float', 'Shimmer', 'Neon', 'Metal', 'Glitch']
export const BG_FX = ['Plain', 'Glow', 'Pulse', 'Scanlines', 'Grain', 'Pixel rain', 'Grid', 'Stripes', 'Dots']
export const SPEEDS = ['Slow', 'Calm', 'Lively', 'Fast']

export type Colours = [number, number, number, number] // background, centre, front left, front right
export interface Look { fx: [number, number, number, number]; speed: number; yaw: number; pitch: number; zoom: number }
export const LOOK_DEFAULT: Look = { fx: [0, 0, 0, 0], speed: 1, yaw: 0, pitch: 74, zoom: 100 }
export const LOGO_COLOURS: Colours = [0, 3, 2, 2]

// a value that is not a number (a corrupted design) falls to the low end, never NaN in the calldata
const clamp = (v: number, a: number, b: number) => (Number.isFinite(v) ? Math.min(b, Math.max(a, Math.round(v))) : a)
const hexRgb = (h: string): [number, number, number] => {
  const v = /^#[0-9a-fA-F]{6}$/.test(h) ? parseInt(h.slice(1), 16) : 0
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

export const toHex = (b: Uint8Array) => '0x' + Array.from(b, v => v.toString(16).padStart(2, '0')).join('')
export function fromHex(h: string): Uint8Array {
  const s = h.startsWith('0x') ? h.slice(2) : h
  const out = new Uint8Array(s.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16)
  return out
}

// ── Colours ─────────────────────────────────────────────────────────────

function toLab(h: string): [number, number, number] {
  const lin = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const [r, g, b] = hexRgb(h).map(lin)
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047)
  const y = f(r * 0.2126 + g * 0.7152 + b * 0.0722)
  const z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}
const PALETTE_LAB = K1N0.map(toLab)

/** The palette index nearest to any colour (perceived difference) */
export function nearestIndex(c: string): number {
  const k = c.toLowerCase()
  const exact = K1N0.indexOf(k)
  if (exact >= 0) return exact
  const [l, a, b] = toLab(k)
  let best = 0
  let bd = Infinity
  PALETTE_LAB.forEach(([l2, a2, b2], i) => {
    const d = (l - l2) ** 2 + (a - a2) ** 2 + (b - b2) ** 2
    if (d < bd) { bd = d; best = i }
  })
  return best
}
export const nearestK1N0 = (c: string) => K1N0[nearestIndex(c)]
export const inPalette = (c: string) => K1N0.includes(c.toLowerCase())

/** The contract's rule: background never black; the coloured blocks apart from the background */
export function validColours(c: Colours): boolean {
  if (c.some(v => !Number.isInteger(v) || v < 0 || v > 15)) return false
  return c[0] !== INK && c.slice(1).every(v => v !== c[0])
}

export const coloursHex = (c: Colours) => '0x' + c.map(v => v.toString(16).padStart(2, '0')).join('')
export const coloursFrom = (h: string): Colours => { const b = fromHex(h); return [b[0], b[1], b[2], b[3]] }

/** What a Lab design becomes as a K1N0: its background, centre block and two front blocks */
export function coloursFromDesign(d: KDesign): { colours: Colours; exact: boolean; problems: string[] } {
  const bgSrc = d.bg.visible ? d.bg.fill.a : '#fbc500'
  const head = (i: number) => (d.head.useFill ? d.head.fill.a : d.head.cubes[i] ?? '#0f0d0a')
  const src = [bgSrc, head(3), head(5), head(6)]
  const colours = src.map(nearestIndex) as Colours
  const exact = src.every(inPalette)
  const problems: string[] = []
  if (colours[0] === INK) problems.push('The background cannot be black: the X and the head blocks are.')
  const same = colours.slice(1).map((v, i) => (v === colours[0] ? SLOTS[i + 1] : '')).filter(Boolean)
  if (same.length) problems.push(`${same.join(' and ')} ${same.length > 1 ? 'are' : 'is'} the same colour as the background.`)
  return { colours, exact, problems }
}

/** The minted look a design starts with: the 3D view it was framed in (effects are set after the mint) */
export function lookFromDesign(d: KDesign): Look {
  // K1N0 mode: the effects and speed chosen in the editor; the view is where the design is turned
  // to now (any tool may have moved the camera), as in every other case
  const base: Look = d.look ? { ...d.look, fx: [...d.look.fx] as Look['fx'] } : { ...LOOK_DEFAULT, fx: [0, 0, 0, 0] }
  if (d.view !== '3d' || !d.cam || ![d.cam.yaw, d.cam.pitch, d.cam.zoom].every(Number.isFinite)) return d.look ? base : { ...LOOK_DEFAULT }
  const yaw = ((((d.cam.yaw + 180) % 360) + 360) % 360) - 180
  return { ...base, yaw: Math.min(178, Math.round(yaw / 2) * 2), pitch: clamp(d.cam.pitch, 20, 89), zoom: clamp(d.cam.zoom * 100, 60, 190) }
}

export interface MintCheck {
  colours: Colours
  /** mintable exactly as it looks (colours, shape and fills) */
  exact: boolean
  /** what the mint will change on its own */
  changes: string[]
  /** what the visitor must change first (the contract would refuse it) */
  problems: string[]
  /** made in the Lab but not part of a K1N0 (it can come back as a look after the mint) */
  notMinted: string[]
}

const isInk = (c: string) => c.toLowerCase() === K1N0[INK]
const fillName = (k: string) => (k === 'gradient' ? 'gradient' : 'pattern')

/** The mint rules, checked against a Lab design: what carries over, what changes, what blocks */
export function mintCheck(d: KDesign): MintCheck {
  const { colours, problems } = coloursFromDesign(d)
  const changes: string[] = []
  const notMinted: string[] = []
  if (d.form === 'pixel') changes.push('Pixel form: a K1N0 is minted as the clay figure. The painted pixels are not used: its colours come from the head of the vector figure, shown here.')
  if (!d.bg.visible) changes.push('The background is hidden: it mints as Yellow.')
  else if (d.bg.fill.kind !== 'solid') changes.push(`Background ${fillName(d.bg.fill.kind)}: it mints as one solid colour.`)
  if (!d.body.visible || d.body.line || d.body.fill.kind !== 'solid' || !isInk(d.body.fill.a)) changes.push('The X is always solid black.')
  const headSrc = (i: number) => (d.head.useFill ? d.head.fill.a : d.head.cubes[i] ?? K1N0[INK])
  const otherBlocks = [0, 1, 2, 4].some(i => !isInk(headSrc(i)))
  if (!d.head.visible || d.head.line) changes.push('The head is always solid blocks.')
  if (otherBlocks) changes.push('The back row and the two side blocks of the head are always black.')
  if (d.head.useFill && d.head.fill.kind !== 'solid') changes.push(`Head ${fillName(d.head.fill.kind)}: the coloured blocks mint as solid colours.`)
  const src = [d.bg.visible ? d.bg.fill.a : K1N0[0], headSrc(3), headSrc(5), headSrc(6)]
  src.forEach((c, i) => { if (!inPalette(c)) changes.push(`${SLOTS[i]} ${c.toUpperCase()} becomes ${NAMES[colours[i]]}, the nearest K1N0 colour.`) })
  const fx = d.fx
  if (fx.glow || fx.glitch || fx.pixel || fx.grain || fx.scan || fx.depth) notMinted.push('Effects')
  if (d.anim.loops.length) notMinted.push('Motion')
  if (d.img) notMinted.push('Picture')
  return { colours, exact: !changes.length && !problems.length, changes, problems, notMinted }
}

/** The same design, changed only where the mint would change it: what you see is what you mint */
export function mintReady(d: KDesign): KDesign {
  const { colours } = coloursFromDesign(d)
  const [bg, centre, frontL, frontR] = colours.map(i => K1N0[i])
  const ink = K1N0[INK]
  return {
    ...d,
    form: 'vector',
    bg: { ...d.bg, visible: true, fill: { kind: 'solid', a: bg } },
    body: { ...d.body, visible: true, line: false, fill: { kind: 'solid', a: ink } },
    head: { ...d.head, visible: true, line: false, useFill: false, fill: { kind: 'solid', a: ink }, cubes: [ink, ink, ink, centre, ink, frontL, frontR] },
  }
}

/** A Lab design that shows a K1N0: the black X and blocks, and its four colours */
export function designFromColours(c: Colours, base: KDesign, look: Look = LOOK_DEFAULT, name = 'K1N0'): KDesign {
  const [bg, centre, frontL, frontR] = c.map(i => K1N0[i])
  const ink = K1N0[INK]
  return {
    ...base,
    name,
    form: 'vector',
    view: '3d',
    bg: { visible: true, line: false, fill: { kind: 'solid', a: bg } },
    body: { visible: true, line: false, fill: { kind: 'solid', a: ink } },
    head: { visible: true, line: false, useFill: false, fill: { kind: 'solid', a: ink }, cubes: [ink, ink, ink, centre, ink, frontL, frontR] },
    fx: { ...base.fx, glow: 0, glitch: 0, pixel: 0, grain: 0, scan: 0, depth: 0 },
    anim: { ...base.anim, loops: [] },
    cam: { yaw: look.yaw, pitch: look.pitch, zoom: look.zoom / 100 },
    img: null,
    look: { ...look, fx: [...look.fx] as Look['fx'] }, // K1N0 mode
  }
}

// ── Look ────────────────────────────────────────────────────────────────

export function encodeLook(l: Look): string {
  const yaw = clamp(l.yaw / 2, -128, 127)
  const b = [...l.fx.map(v => clamp(v, 0, 8)), clamp(l.speed, 0, 3), (yaw + 256) % 256, clamp(l.pitch, 20, 89), clamp(l.zoom, 60, 190)]
  return '0x' + b.map(v => v.toString(16).padStart(2, '0')).join('')
}
export function decodeLook(h: string): Look {
  const b = fromHex(h)
  return { fx: [b[0], b[1], b[2], b[3]], speed: b[4], yaw: ((b[5] << 24) >> 24) * 2, pitch: b[6], zoom: b[7] }
}

/** The data the renderer and the 3D piece draw from (KLab.dataOf): colours · look · looks · title */
export function dataHex(c: Colours, look: Look, looks = 1, title = ''): string {
  const t = cleanName(title)
  const th = Array.from(t, ch => ch.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  return coloursHex(c) + encodeLook(look).slice(2) + looks.toString(16).padStart(4, '0') + t.length.toString(16).padStart(2, '0') + th
}

/** The Lab's own names for a design: never used as an on-chain title */
export const isDefaultName = (n: string) => /^(Original K(1N0)?|Remix( of)? .*|Untitled|K1N0|Imported K)$/i.test(n.trim())

/** The contract reserves the artist's name: "k4ncun0" in any case, 4/a and 0/o alike */
export const hasArtistName = (t: string) => t.toLowerCase().replace(/4/g, 'a').replace(/0/g, 'o').includes('kancuno')

const NAME_OK = /[A-Za-z0-9 \-_.'!#]/
export function cleanName(name: string): string {
  return [...name].filter(c => NAME_OK.test(c)).join('').replace(/\s+/g, ' ').trim().slice(0, 32)
}
