// The 3D K of THE K.LAB as plain numbers (no three.js), shared by the renderer (k3d.ts)
// and the 2D tools that need its footprint (Image Wrap's framing view).
// The numbers come from src/lib/world/figure.ts, so the Lab's K and the home page's K are one figure.

import { BAR_ANGLE, BAR_SIZE, BAR_Y, CUBE_SIZE, FLAT_CENTER, HEAD_POS, LEVEL } from '@/lib/world/figure'

export { BAR_ANGLE, BAR_SIZE, BAR_Y, CUBE_SIZE, FLAT_CENTER, LEVEL }
export const HEAD3D = HEAD_POS

export const S = 11.5 // flat canvas units (100x100 design space) per world unit; canvas centre = world origin

// Seen from above, in flat canvas units: world (x, z) → (50 + x·S, 50 + z·S), z = -(y - FLAT_CENTER)
export type Pt = [number, number]
const toCanvas = (x: number, z: number): Pt => [50 + x * S, 50 + z * S]
const zOf = (y: number) => -(y - FLAT_CENTER)

export function cubeFootprint(i: number): Pt[] {
  const h = HEAD3D[i]
  const hw = CUBE_SIZE[0] / 2
  const hd = CUBE_SIZE[2] / 2
  const z = zOf(h.y)
  return [toCanvas(h.x - hw, z - hd), toCanvas(h.x + hw, z - hd), toCanvas(h.x + hw, z + hd), toCanvas(h.x - hw, z + hd)]
}

// Bar i (0: +angle, 1: -angle), rotated about the vertical axis like the mesh
export function barFootprint(i: number): Pt[] {
  const a = i === 0 ? BAR_ANGLE : -BAR_ANGLE
  const c = Math.cos(a)
  const s = Math.sin(a)
  const L = BAR_SIZE[0] / 2
  const W = BAR_SIZE[2] / 2
  const z0 = zOf(0)
  return ([[-L, -W], [L, -W], [L, W], [-L, W]] as Pt[]).map(([x, z]) => toCanvas(x * c + z * s, z0 - x * s + z * c))
}

export type Box = { x: number; y: number; w: number; h: number }
function boxOf(polys: Pt[][], pad = 1): Box {
  const xs = polys.flat().map(p => p[0])
  const ys = polys.flat().map(p => p[1])
  const x = Math.min(...xs) - pad
  const y = Math.min(...ys) - pad
  return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y }
}

export const HEAD_POLYS = HEAD3D.map((_, i) => cubeFootprint(i))
export const BAR_POLYS = [barFootprint(0), barFootprint(1)]
export const FIG_BOX3D = boxOf([...HEAD_POLYS, ...BAR_POLYS])
export const HEAD_BOX3D = boxOf(HEAD_POLYS)
export const BODY_BOX3D = boxOf(BAR_POLYS)
