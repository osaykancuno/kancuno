// Shapes for the 3D world. Three pools of pieces are arranged differently in
// every chapter and the engine morphs between arrangements:
//   bars   – the two crossed bars of the X (the figure's body)
//   cubes  – the seven head cubes
//   voxels – small blocks that build the rings, the 100 field and the halo
// The figure (bars + cubes) is a faithful 3D copy of the K4NCUN0 logo, measured
// from the original artwork: unit = one head cube.

import { Color, Euler, Quaternion, Vector3 } from 'three'
import { PALETTE } from './palette'
import { BAR_ANGLE, BAR_SIZE, BAR_Y, CUBE_SIZE, FLAT_CENTER, HEAD_POS, LEVEL } from './figure'

export { BAR_SIZE, CUBE_SIZE }

export const POOLS = ['bars', 'cubes', 'voxels'] as const
export type PoolKey = (typeof POOLS)[number]

// Floor lattice: diamond cells, CELL units across (each chapter sits in one cell)
export const CELL = 9.6

export const VOXEL_SIDE = 14
export const POOL_SIZE: Record<PoolKey, number> = { bars: 2, cubes: 7, voxels: VOXEL_SIDE * VOXEL_SIDE }

// Piece dimensions (BAR_SIZE, CUBE_SIZE) and the figure's layout live in ./figure,
// shared with THE K.LAB; geometry is built at that size, scale stays ~1 for the figure.

export interface PoolShape {
  pos: Float32Array // world positions, 3 per piece
  rot: Float32Array // world quaternions, 4 per piece
  scl: Float32Array // scales, 3 per piece
  col: Float32Array // linear rgb, 3 per piece
}

export interface ChapterShape {
  center: [number, number]
  pools: Record<PoolKey, PoolShape>
  camPos: Vector3
  camTarget: Vector3
  // Where the focus sits on screen (fraction of the viewport) so the copy has room
  shift: { land: [number, number]; port: [number, number] }
  // Idle motion: world-space offset for piece i of a pool at time t
  idle: (pool: PoolKey, i: number, t: number, out: Vector3) => void
  // Alternative voxel arrangements the engine can morph to while staying in this chapter
  variants?: Record<string, PoolShape>
}

export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

type Piece = { p: Vector3; q: Quaternion; s: Vector3; c: number }
type Layout = Record<PoolKey, Piece[]>

const X_AXIS = new Vector3(1, 0, 0)
const Y_AXIS = new Vector3(0, 1, 0)
const qAxis = (axis: Vector3, a: number) => new Quaternion().setFromAxisAngle(axis, a)
const qEuler = (x: number, y: number, z: number) => new Quaternion().setFromEuler(new Euler(x, y, z))

// ── The figure, lying flat (as in the artwork: seen from above) ─────────────
// Logo 2D coordinates (x right, y up, X crossing at 0,0) → world: x, height, -y.
// Positions and heights come from ./figure (one layout for the site and THE K.LAB)
const HEAD_COLOURS = [PALETTE.ink, PALETTE.ink, PALETTE.ink, PALETTE.purple, PALETTE.ink, PALETTE.pink, PALETTE.pink]
const HEAD = HEAD_POS.map((h, i) => ({ ...h, c: HEAD_COLOURS[i] }))

function flatFigure(): { bars: Piece[]; cubes: Piece[] } {
  const z = (y: number) => -(y - FLAT_CENTER)
  return {
    bars: [BAR_ANGLE, -BAR_ANGLE].map(a => ({
      p: new Vector3(0, BAR_Y, z(0)),
      q: qAxis(Y_AXIS, a),
      s: new Vector3(1, 1, 1),
      c: PALETTE.ink,
    })),
    cubes: HEAD.map(h => ({
      p: new Vector3(h.x, LEVEL[h.level], z(h.y)),
      q: new Quaternion(),
      s: new Vector3(1, 1, 1),
      c: h.c,
    })),
  }
}

// Standing: the flat figure rotated up to face the camera (+z), lifted off the floor
function standingFigure(scale = 1, lift = 3.25): { bars: Piece[]; cubes: Piece[] } {
  const up = qAxis(X_AXIS, Math.PI / 2)
  const f = flatFigure()
  const stand = (pc: Piece): Piece => {
    const p = pc.p.clone().applyQuaternion(up)
    p.z -= 0.55 // centre the depth
    p.multiplyScalar(scale)
    p.y += lift
    return { p, q: up.clone().multiply(pc.q), s: pc.s.clone().multiplyScalar(scale), c: pc.c }
  }
  return { bars: f.bars.map(stand), cubes: f.cubes.map(stand) }
}

// Voxels tucked away inside the figure (invisible), so they seem to spring from it
function hiddenVoxels(flat: boolean): Piece[] {
  return Array.from({ length: POOL_SIZE.voxels }, (_, i) => {
    const t = (hash(i * 3.1) - 0.5) * BAR_SIZE[0] * 0.8
    const a = i % 2 ? BAR_ANGLE : -BAR_ANGLE
    const x = Math.cos(a) * t, y = Math.sin(a) * t
    const p = flat ? new Vector3(x, BAR_Y, -(y - FLAT_CENTER)) : new Vector3(x, y + 2.6, 0)
    return { p, q: qEuler(hash(i) * 3, hash(i + 1) * 3, 0), s: new Vector3(0.001, 0.001, 0.001), c: PALETTE.ink }
  })
}

const accent = (i: number) => {
  const h = hash(i * 3.3)
  return h < 0.12 ? PALETTE.pink : h < 0.22 ? PALETTE.purple : PALETTE.ink
}

// ── Chapter layouts (local frame) ───────────────────────────────────────────

// 01 Intro: the logo exactly as in the artwork, lying in its diamond frame
function introLayout(): Layout {
  return { ...flatFigure(), voxels: hiddenVoxels(true) }
}

// 02 Profile: the figure stands up and opens slightly, layer by layer (an exploded
// view that still reads as the logo), a ring of blocks turning on the floor around it
function profileLayout(): Layout {
  const f = standingFigure()
  const depth = [0.3, 0.7, 1.15] // head rows pulled toward the viewer
  f.bars[0].p.z -= 0.18
  f.bars[1].p.z += 0.04
  f.cubes.forEach((c, i) => {
    const h = HEAD[i]
    c.p.x *= 1.04
    c.p.y += h.level * 0.05
    c.p.z += depth[h.level]
  })
  const voxels = Array.from({ length: POOL_SIZE.voxels }, (_, i) => {
    const a = (i / POOL_SIZE.voxels) * Math.PI * 2
    const r = RING_R + (hash(i * 1.9) - 0.5) * 0.7
    const s = 0.1 + hash(i * 4.1) * 0.14
    const p = new Vector3(Math.cos(a) * r, s / 2 + hash(i * 2.3) * 0.25, Math.sin(a) * r)
    return { p, q: qEuler(0, hash(i) * 3, 0), s: new Vector3(s, s, s), c: accent(i) }
  })
  return { ...f, voxels }
}
const RING_R = 3.3

// 03 Experiments: concentric rings of blocks, one per layer of a song (as in
// JAMVERSE, where every part is a ring you can step into). The rings rise toward
// the outside like a small amphitheatre; the figure performs in the middle.
const EXP_RINGS = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
const EXP_COUNTS = [18, 24, 30, 36, 42, 46] // 196 blocks in all
const EXP_STEP = 0.14 // each ring sits a little higher than the one inside it
const EXP_RING = new Uint8Array(POOL_SIZE.voxels)
const EXP_J = new Uint8Array(POOL_SIZE.voxels)
const EXP_ANGLE = new Float32Array(POOL_SIZE.voxels)
{
  let i = 0
  EXP_COUNTS.forEach((n, k) => {
    for (let j = 0; j < n; j++, i++) {
      EXP_RING[i] = k
      EXP_J[i] = j
      EXP_ANGLE[i] = (j / n) * Math.PI * 2 + k * 0.35
    }
  })
}
function experimentsLayout(): Layout {
  const voxels: Piece[] = Array.from({ length: POOL_SIZE.voxels }, (_, i) => {
    const k = EXP_RING[i], j = EXP_J[i], a = EXP_ANGLE[i], r = EXP_RINGS[k]
    // A frozen waveform: every ring has its own number of peaks
    const wave = Math.abs(Math.sin(((j / EXP_COUNTS[k]) * Math.PI * 2 * (k + 2)) / 2))
    const h = 0.12 + wave * wave * (0.26 + k * 0.05)
    const c = k === 0 ? PALETTE.purple
      : k === 3 && j % 4 === 0 ? PALETTE.pink
        : k === 5 && j % 6 === 0 ? PALETTE.purple
          : PALETTE.ink
    return {
      p: new Vector3(Math.cos(a) * r, k * EXP_STEP + h / 2 + 0.02, Math.sin(a) * r),
      q: qAxis(Y_AXIS, -a),
      s: new Vector3(0.28, h, 0.28),
      c,
    }
  })
  return { ...standingFigure(0.6, 2.6), voxels }
}

// 04 Communities: a 14x14 pixel field that changes with the community tab, the
// figure watching from behind: 100 for The Normies (THE100), FREN for JPEG Frens.
type Lit = Map<number, { c: number; h: number }>
const at = (row: number, col: number) => row * VOXEL_SIDE + col

const DIGITS: Record<string, string[]> = {
  '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'],
  '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
}
const LIT_100: Lit = new Map()
;['1', '0', '0'].forEach((d, n) =>
  DIGITS[d].forEach((row, ry) =>
    row.split('').forEach((ch, rx) => {
      if (ch === 'X') LIT_100.set(at(5 + ry, 2 + n * 4 + rx), { c: n === 0 ? PALETTE.purple : PALETTE.pink, h: 1.3 })
    }),
  ),
)

// FREN for JPEG Frens on one line, same rows and height as the 100. Narrow F and E
// (2 wide) leave room for a real diagonal on the N: 2+1+3+1+2+1+4 = all 14 columns.
const FREN_GLYPHS: Record<string, string[]> = {
  F: ['XX', 'X.', 'XX', 'X.', 'X.'],
  R: ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'],
  E: ['XX', 'X.', 'XX', 'X.', 'XX'],
  N: ['X..X', 'XX.X', 'X.XX', 'X..X', 'X..X'],
}
const LIT_FREN: Lit = new Map()
{
  let col = 0
  for (const g of 'FREN') {
    const glyph = FREN_GLYPHS[g]
    glyph.forEach((row, ry) =>
      row.split('').forEach((ch, rx) => {
        if (ch === 'X') LIT_FREN.set(at(5 + ry, col + rx), { c: g === 'F' ? PALETTE.purple : PALETTE.pink, h: 1.3 })
      }),
    )
    col += glyph[0].length + 1
  }
}

export const COMMUNITY_FIELDS: Record<string, Lit> = { normies: LIT_100, jpegfrens: LIT_FREN }

const GRID = 0.45
function fieldVoxels(lit: Lit): Piece[] {
  const n = VOXEL_SIDE
  return Array.from({ length: POOL_SIZE.voxels }, (_, i) => {
    const col = i % n, row = Math.floor(i / n)
    const px = lit.get(i)
    const h = px ? px.h : 0.28
    return {
      p: new Vector3((col - (n - 1) / 2) * GRID, h / 2 + 0.02, (row - (n - 1) / 2) * GRID),
      q: new Quaternion(),
      s: new Vector3(0.4, h, 0.4),
      c: px ? px.c : PALETTE.ink,
    }
  })
}
function communityLayout(field: Lit): Layout {
  const fig = standingFigure(0.62, 2.1)
  for (const pc of [...fig.bars, ...fig.cubes]) pc.p.z -= 3.9
  return { ...fig, voxels: fieldVoxels(field) }
}

// 05 Contact: back to the artwork, lying flat in its frame
function contactLayout(): Layout {
  return { ...flatFigure(), voxels: hiddenVoxels(true) }
}

// ── World-space conversion ──────────────────────────────────────────────────
const tmpC = new Color()

function toPool(pieces: Piece[], yawQ: Quaternion, origin: Vector3): PoolShape {
  const n = pieces.length
  const pos = new Float32Array(n * 3), rot = new Float32Array(n * 4)
  const scl = new Float32Array(n * 3), col = new Float32Array(n * 3)
  pieces.forEach((pc, i) => {
    pc.p.clone().applyQuaternion(yawQ).add(origin).toArray(pos, i * 3)
    pc.q.clone().premultiply(yawQ).toArray(rot, i * 4)
    pc.s.toArray(scl, i * 3)
    tmpC.setHex(pc.c)
    col[i * 3] = tmpC.r; col[i * 3 + 1] = tmpC.g; col[i * 3 + 2] = tmpC.b
  })
  return { pos, rot, scl, col }
}

function chapter(
  layout: Layout,
  center: [number, number],
  yaw: number,
  cam: { pos: [number, number, number]; target: [number, number, number] },
  shift: ChapterShape['shift'],
  idle: ChapterShape['idle'],
  variants?: Record<string, Piece[]>, // alternative voxel layouts, same frame as `layout`
): ChapterShape {
  const yawQ = qAxis(Y_AXIS, yaw)
  const origin = new Vector3(center[0], 0, center[1])
  const local = (v: [number, number, number]) => new Vector3(...v).applyQuaternion(yawQ).add(origin)
  return {
    center,
    pools: {
      bars: toPool(layout.bars, yawQ, origin),
      cubes: toPool(layout.cubes, yawQ, origin),
      voxels: toPool(layout.voxels, yawQ, origin),
    },
    camPos: local(cam.pos),
    camTarget: local(cam.target),
    shift,
    idle,
    variants: variants && Object.fromEntries(Object.entries(variants).map(([k, v]) => [k, toPool(v, yawQ, origin)])),
  }
}

export function buildChapters(): ChapterShape[] {
  const still: ChapterShape['idle'] = (_p, _i, _t, out) => { out.set(0, 0, 0) }

  // Exploded figure floats; the halo turns slowly
  const profileIdle: ChapterShape['idle'] = (pool, i, t, out) => {
    if (pool === 'voxels') {
      const a = t * 0.07
      const b = (i / POOL_SIZE.voxels) * Math.PI * 2
      out.set((Math.cos(b + a) - Math.cos(b)) * RING_R, 0, (Math.sin(b + a) - Math.sin(b)) * RING_R)
    } else {
      const h = hash(i * 5.1 + (pool === 'bars' ? 9 : 0))
      const k = pool === 'cubes' ? 1 : 0.4
      out.set(0, Math.sin(t * 0.9 + h * 6) * 0.07 * k, Math.cos(t * 0.7 + h * 4) * 0.08 * k)
    }
  }
  // Each ring turns its own way and a wave runs round it, like layers playing together
  const experimentsIdle: ChapterShape['idle'] = (pool, i, t, out) => {
    if (pool === 'voxels') {
      const k = EXP_RING[i], a = EXP_ANGLE[i], r = EXP_RINGS[k]
      const w = (k % 2 ? -1 : 1) * (0.05 + k * 0.012) * t
      const lift = 0.12 * (0.5 + 0.5 * Math.sin(t * 2.2 - a * 2 - k * 0.9))
      out.set((Math.cos(a + w) - Math.cos(a)) * r, lift, (Math.sin(a + w) - Math.sin(a)) * r)
    } else out.set(0, Math.sin(t * 1.1) * 0.1, 0)
  }
  const communityIdle: ChapterShape['idle'] = (pool, i, t, out) => {
    if (pool === 'voxels') {
      const col = i % VOXEL_SIDE, row = Math.floor(i / VOXEL_SIDE)
      out.set(0, 0.13 * Math.sin(t * 1.4 - (col + row) * 0.45), 0)
    } else out.set(0, Math.sin(t * 1.1) * 0.08, 0)
  }

  return [
    chapter(introLayout(), [0, 0], 0,
      { pos: [0, 15, 4.4], target: [0, 0, 0.1] },
      { land: [0.2, 0], port: [0, 0.17] }, still),
    chapter(profileLayout(), [0, 0], 0,
      { pos: [-5.8, 4.6, 14.2], target: [0, 3.0, 0.5] },
      { land: [-0.19, 0], port: [0, 0.2] }, profileIdle),
    chapter(experimentsLayout(), [-CELL, -CELL], 0,
      { pos: [0, 13.8, 13.4], target: [0, 1.5, 0] },
      { land: [0.21, 0.02], port: [0, 0.3] }, experimentsIdle),
    chapter(communityLayout(LIT_100), [CELL, -CELL * 2], Math.PI / 4,
      { pos: [0, 11.8, 12.4], target: [0, 1.0, -1.0] },
      { land: [-0.26, 0.02], port: [0, 0.2] }, communityIdle,
      Object.fromEntries(Object.entries(COMMUNITY_FIELDS).map(([k, lit]) => [k, fieldVoxels(lit)]))),
    chapter(contactLayout(), [0, -CELL * 3], 0,
      { pos: [0, 15, 4.4], target: [0, 0, 0.1] },
      { land: [0.2, 0], port: [0, 0.17] }, still),
  ]
}
