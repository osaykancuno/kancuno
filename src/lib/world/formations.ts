// Shapes for the 3D world. Three pools of pieces are arranged differently in
// every chapter and the engine morphs between arrangements:
//   bars   – the two crossed bars of the X (the figure's body)
//   cubes  – the seven head cubes
//   voxels – small blocks that build the tower, the 100 field and the halo
// The figure (bars + cubes) is a faithful 3D copy of the K4NCUN0 logo, measured
// from the original artwork: unit = one head cube.

import { Color, Euler, Quaternion, Vector3 } from 'three'
import { PALETTE } from './palette'

export const POOLS = ['bars', 'cubes', 'voxels'] as const
export type PoolKey = (typeof POOLS)[number]

// Floor lattice: diamond cells, CELL units across (each chapter sits in one cell)
export const CELL = 9.6

export const VOXEL_SIDE = 14
export const POOL_SIZE: Record<PoolKey, number> = { bars: 2, cubes: 7, voxels: VOXEL_SIDE * VOXEL_SIDE }

// Piece dimensions (geometry is built at this size, scale stays ~1 for the figure)
export const BAR_SIZE: [number, number, number] = [3.62, 0.62, 1.0] // length, thickness, width
export const CUBE_SIZE: [number, number, number] = [1, 0.8, 1]      // width, height, depth

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
const BAR_ANGLE = (47.5 * Math.PI) / 180
const FLAT_CENTER = 0.62 // 2D y of the figure's visual centre, so it sits centred
const BAR_Y = BAR_SIZE[1] / 2 + 0.04
const LEVEL = [0.44, 0.74, 1.06] // cube centre heights: back row, middle row, front row

const HEAD: { x: number; y: number; level: number; c: number }[] = [
  { x: -0.54, y: 2.96, level: 0, c: PALETTE.ink },
  { x: 0.54, y: 2.96, level: 0, c: PALETTE.ink },
  { x: -1.08, y: 2.36, level: 1, c: PALETTE.ink },
  { x: 0, y: 2.34, level: 1, c: PALETTE.purple },
  { x: 1.08, y: 2.36, level: 1, c: PALETTE.ink },
  { x: -0.56, y: 1.74, level: 2, c: PALETTE.pink },
  { x: 0.56, y: 1.74, level: 2, c: PALETTE.pink },
]

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

// 03 Works: a twisting tower of blocks, the figure hovering on top while it is being built
const TOWER_LAYER_H = 0.42
function worksLayout(): Layout {
  const n = VOXEL_SIDE
  const voxels: Piece[] = Array.from({ length: POOL_SIZE.voxels }, (_, i) => {
    const layer = Math.floor(i / n), k = i % n
    // Tapering, twisting tower with air between the blocks; a purple helix runs up it
    const r = 2.25 - layer * 0.055
    const a = (k / n) * Math.PI * 2 + layer * 0.3
    const len = ((Math.PI * 2 * r) / n) * 0.7
    const helix = k === (layer * 2) % n
    return {
      p: new Vector3(Math.cos(a) * r, 0.2 + layer * TOWER_LAYER_H, Math.sin(a) * r),
      q: qAxis(Y_AXIS, -a + Math.PI / 2),
      s: new Vector3(len, 0.28, 0.4),
      c: layer === n - 1 ? (k % 2 ? PALETTE.pink : PALETTE.purple) : helix ? PALETTE.purple : PALETTE.ink,
    }
  })
  const top = 0.2 + (n - 1) * TOWER_LAYER_H
  return { ...standingFigure(0.5, top + 1.3), voxels }
}

// 04 Community: a 14x14 pixel field that spells 100 (THE100), the figure watching from behind
const DIGITS: Record<string, string[]> = {
  '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'],
  '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
}
const LIT = new Map<number, number>()
;['1', '0', '0'].forEach((d, n) =>
  DIGITS[d].forEach((row, ry) =>
    row.split('').forEach((ch, rx) => {
      if (ch === 'X') LIT.set((5 + ry) * VOXEL_SIDE + 2 + n * 4 + rx, n === 0 ? PALETTE.purple : PALETTE.pink)
    }),
  ),
)
const GRID = 0.45
function communityLayout(): Layout {
  const n = VOXEL_SIDE
  const voxels: Piece[] = Array.from({ length: POOL_SIZE.voxels }, (_, i) => {
    const col = i % n, row = Math.floor(i / n)
    const lit = LIT.get(i)
    const h = lit ? 1.3 : 0.28
    return {
      p: new Vector3((col - (n - 1) / 2) * GRID, h / 2 + 0.02, (row - (n - 1) / 2) * GRID),
      q: new Quaternion(),
      s: new Vector3(0.4, h, 0.4),
      c: lit ?? PALETTE.ink,
    }
  })
  const fig = standingFigure(0.62, 2.1)
  for (const pc of [...fig.bars, ...fig.cubes]) pc.p.z -= 3.9
  return { ...fig, voxels }
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
  const worksIdle: ChapterShape['idle'] = (pool, i, t, out) => {
    if (pool === 'voxels') {
      // Top two layers hover in and out of place: the build is never finished
      const k = Math.max(0, Math.floor(i / VOXEL_SIDE) - (VOXEL_SIDE - 3)) / 2
      out.set(0, k * (0.35 + Math.sin(t * 1.3 + i * 0.9) * 0.3), 0)
    } else out.set(0, Math.sin(t * 1.1) * 0.12, 0)
  }
  const communityIdle: ChapterShape['idle'] = (pool, i, t, out) => {
    if (pool === 'voxels') {
      const col = i % VOXEL_SIDE, row = Math.floor(i / VOXEL_SIDE)
      out.set(0, (LIT.has(i) ? 0.1 : 0.16) * Math.sin(t * 1.4 - (col + row) * 0.45), 0)
    } else out.set(0, Math.sin(t * 1.1) * 0.08, 0)
  }

  return [
    chapter(introLayout(), [0, 0], 0,
      { pos: [0, 15, 4.4], target: [0, 0, 0.1] },
      { land: [0.2, 0], port: [0, 0.17] }, still),
    chapter(profileLayout(), [0, 0], 0,
      { pos: [-5.8, 4.6, 14.2], target: [0, 3.0, 0.5] },
      { land: [-0.19, 0], port: [0, 0.2] }, profileIdle),
    chapter(worksLayout(), [CELL, -CELL], 0,
      { pos: [0, 6.6, 18], target: [0, 4.4, 0] },
      { land: [0.19, 0], port: [0, 0.2] }, worksIdle),
    chapter(communityLayout(), [-CELL, -CELL * 2], Math.PI / 4,
      { pos: [0, 11.8, 12.4], target: [0, 1.0, -1.0] },
      { land: [-0.22, 0.02], port: [0, 0.3] }, communityIdle),
    chapter(contactLayout(), [0, -CELL * 3], 0,
      { pos: [0, 15, 4.4], target: [0, 0, 0.1] },
      { land: [0.2, 0], port: [0, 0.17] }, still),
  ]
}
