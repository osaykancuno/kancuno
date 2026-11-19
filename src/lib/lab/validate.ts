// Imported K design JSON is untrusted: rebuild a clean design from the defaults,
// copying only known fields with checked types, clamped numbers and #rrggbb colours.
import { clampCam } from './orbit'
import { IMAGE_DEFAULT, isImageSrc } from './image'
import { ANIM_LOOPS, defaultDesign, GRID_SIZES, presetGrid, type AnimLoop, type Fill, type KDesign, type PartStyle, type PatternKind } from './design'

const HEX = /^#[0-9a-fA-F]{6}$/
const PATTERNS: PatternKind[] = ['stripes', 'dots', 'checker', 'scan', 'grid']

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const color = (v: unknown, fb: string) => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : fb)
const num = (v: unknown, fb: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fb
const bool = (v: unknown, fb: boolean) => (typeof v === 'boolean' ? v : fb)

export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v)

function fill(v: unknown, fb: Fill): Fill {
  if (!isObj(v)) return fb
  const a = color(v.a, 'a' in fb ? fb.a : '#000000')
  if (v.kind === 'solid') return { kind: 'solid', a }
  if (v.kind === 'gradient') return { kind: 'gradient', a, b: color(v.b, '#000000'), angle: num(v.angle, 90, -360, 360) }
  if (v.kind === 'pattern') {
    const pattern = PATTERNS.includes(v.pattern as PatternKind) ? (v.pattern as PatternKind) : 'stripes'
    return { kind: 'pattern', pattern, a, b: color(v.b, '#000000'), scale: num(v.scale, 4, 1, 20) }
  }
  return fb
}

function partStyle(v: unknown, fb: PartStyle): PartStyle {
  if (!isObj(v)) return fb
  return { visible: bool(v.visible, fb.visible), line: bool(v.line, fb.line), fill: fill(v.fill, fb.fill) }
}

export function parseDesign(input: unknown): KDesign {
  if (!isObj(input)) throw new Error('Not a K design file.')
  if (input.v !== 1) throw new Error('Unknown K design version.')
  const d = defaultDesign()
  const name = typeof input.name === 'string' ? input.name.replace(/[\u0000-\u001f]/g, '').slice(0, 60).trim() : ''
  d.name = name || 'Imported K'
  d.form = input.form === 'pixel' ? 'pixel' : 'vector'
  d.view = input.view === 'flat' ? 'flat' : '3d'
  d.bg = partStyle(input.bg, d.bg)
  d.body = partStyle(input.body, d.body)
  if (isObj(input.head)) {
    const cubes = Array.isArray(input.head.cubes) ? input.head.cubes : []
    d.head = {
      ...partStyle(input.head, d.head),
      useFill: bool(input.head.useFill, false),
      cubes: d.head.cubes.map((c, i) => color(cubes[i], c)),
    }
  }
  if (isObj(input.fx)) {
    const f = input.fx
    d.fx = {
      glow: num(f.glow, 0, 0, 1), glitch: num(f.glitch, 0, 0, 1), pixel: num(f.pixel, 0, 0, 1),
      grain: num(f.grain, 0, 0, 1), scan: num(f.scan, 0, 0, 1), depth: num(f.depth, 0, 0, 1),
      seed: Math.round(num(f.seed, 8362, 0, 1e9)),
    }
  }
  if (isObj(input.grid)) {
    const size = (GRID_SIZES as readonly number[]).includes(input.grid.size as number) ? (input.grid.size as number) : 32
    const raw = Array.isArray(input.grid.cells) ? input.grid.cells : null
    d.grid = {
      size,
      gap: num(input.grid.gap, 0, 0, 0.4),
      cells: raw && raw.length === size * size ? raw.map(c => (isHex(c) ? c.toLowerCase() : '')) : presetGrid(size),
    }
  }
  if (isObj(input.anim)) {
    const loops = Array.isArray(input.anim.loops) ? input.anim.loops.filter((l): l is AnimLoop => ANIM_LOOPS.includes(l as AnimLoop)) : []
    d.anim = { loops: Array.from(new Set(loops)), period: num(input.anim.period, 2.4, 0.6, 8) }
  }
  if (isObj(input.img) && isImageSrc(input.img.src)) {
    const m = input.img
    const D = IMAGE_DEFAULT
    d.img = {
      src: m.src as string,
      w: Math.round(num(m.w, 0, 0, 4096)),
      h: Math.round(num(m.h, 0, 0, 4096)),
      target: m.target === 'all' || m.target === 'body' ? m.target : 'head',
      mode: m.mode === 'tile' ? 'tile' : 'print',
      fit: m.fit === 'contain' ? 'contain' : 'cover',
      zoom: num(m.zoom, D.zoom, 0.2, 6),
      x: num(m.x, 0, -2, 2),
      y: num(m.y, 0, -2, 2),
      rot: num(m.rot, 0, -360, 360),
      bright: num(m.bright, 0, -1, 1),
      contrast: num(m.contrast, 0, -1, 1),
      sat: num(m.sat, 1, 0, 2),
      palette: m.palette === 'brand' || m.palette === 'duo' ? m.palette : 'off',
    }
  }
  if (isObj(input.cam)) {
    const c = input.cam
    d.cam = clampCam({ yaw: num(c.yaw, d.cam.yaw, -360, 360), pitch: num(c.pitch, d.cam.pitch, 0, 90), zoom: num(c.zoom, d.cam.zoom, 0.1, 5) })
  }
  // K1N0 mode only with a look the contract accepts; anything else imports as a free remix
  d.look = null
  if (isObj(input.look) && Array.isArray(input.look.fx) && input.look.fx.length === 4) {
    const l = input.look
    const int = (v: unknown, a: number, b: number) => (typeof v === 'number' && Number.isInteger(v) && v >= a && v <= b ? v : null)
    const fx = (l.fx as unknown[]).map(v => int(v, 0, 8))
    const look = { speed: int(l.speed, 0, 3), yaw: int(l.yaw, -180, 178), pitch: int(l.pitch, 20, 89), zoom: int(l.zoom, 60, 190) }
    if (fx.every(v => v !== null) && Object.values(look).every(v => v !== null) && (look.yaw as number) % 2 === 0) {
      d.look = { fx: fx as [number, number, number, number], speed: look.speed!, yaw: look.yaw!, pitch: look.pitch!, zoom: look.zoom! }
    }
  }
  return d
}

export function parseDesignText(text: string): KDesign {
  if (text.length > 2_800_000) throw new Error('File too large for a K design.')
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  return parseDesign(data)
}
