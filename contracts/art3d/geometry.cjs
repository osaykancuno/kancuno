// The K1N0 image in 3D: the clay K of kancuno.com seen from the site's camera, as SVG polygons.
// The figure never changes shape (only its colours and effects do), so its faces are projected
// once, here, and stored in KLabArt3D as constant data: the contract only colours and animates them.
//
//   node art3d/geometry.cjs          → art3d/faces.json, art3d/preview.svg (logo colours)
const fs = require('fs')
const path = require('path')

// figure (src/lib/world/figure.ts)
const BAR = [3.62, 0.62, 1.0], CUBE = [1, 0.8, 1], BAR_ANGLE = (47.5 * Math.PI) / 180, BAR_Y = 0.62 / 2 + 0.04
const PITCH = 1.24, ROW = 0.82, FRONT = 1.22, LEVEL = [0.4, 0.5, 0.62], FC = 0.56
const HEAD = [
  [-PITCH / 2, FRONT + ROW * 2, 0], [PITCH / 2, FRONT + ROW * 2, 0],
  [-PITCH, FRONT + ROW, 1], [0, FRONT + ROW, 1], [PITCH, FRONT + ROW, 1],
  [-PITCH / 2, FRONT, 2], [PITCH / 2, FRONT, 2],
]
// groups: 0 shadow, 1 X (black), 3 the four black blocks of the head (top row and sides),
// 4 centre (slot), 5 front left (slot), 6 front right (slot)
const CUBE_GROUP = [3, 3, 3, 4, 3, 5, 6]

// camera: the site's hero view (yaw 0, pitch 74°), a little closer for a thumbnail
const PITCH_DEG = 74, DIST = Math.hypot(12.4, 3.55) / 1.1, FOV = (34 * Math.PI) / 180
const T = [0, 0.25, 0.25]
const p = (PITCH_DEG * Math.PI) / 180
const EYE = [T[0], T[1] + DIST * Math.sin(p), T[2] + DIST * Math.cos(p)]
const LD = (() => { const v = [-7, 18, -4.9]; const l = Math.hypot(...v); return v.map(x => x / l) })()

const sub = (a, b) => a.map((v, i) => v - b[i])
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = a => { const l = Math.hypot(...a); return a.map(v => v / l) }
const fz = norm(sub(EYE, T)), fx = norm(cross([0, 1, 0], fz)), fy = cross(fz, fx)
const f = 1 / Math.tan(FOV / 2)
function project(q) {
  const d = sub(q, EYE)
  const x = dot(d, fx), y = dot(d, fy), z = dot(d, fz)
  return [50 + (f * x / -z) * 50, 50 - (f * y / -z) * 50, -z]
}

function boxCorners(c, s, ry) {
  const cs = Math.cos(ry), sn = Math.sin(ry)
  const out = []
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const e of [-1, 1]) {
    const lx = (a * s[0]) / 2, ly = (b * s[1]) / 2, lz = (e * s[2]) / 2
    out.push([c[0] + lx * cs + lz * sn, c[1] + ly, c[2] - lx * sn + lz * cs])
  }
  return out
}
// faces as corner indices (a,b,e bits: x,y,z), with their local normal
const FACES = [
  [[4, 5, 7, 6], [1, 0, 0]], [[0, 2, 3, 1], [-1, 0, 0]],
  [[2, 6, 7, 3], [0, 1, 0]], [[0, 1, 5, 4], [0, -1, 0]],
  [[1, 3, 7, 5], [0, 0, 1]], [[0, 4, 6, 2], [0, 0, -1]],
]
function boxFaces(c, s, ry, group) {
  const k = boxCorners(c, s, ry)
  const cs = Math.cos(ry), sn = Math.sin(ry)
  const out = []
  for (const [idx, n0] of FACES) {
    const n = [n0[0] * cs + n0[2] * sn, n0[1], -n0[0] * sn + n0[2] * cs]
    const centre = idx.map(i => k[i]).reduce((a, q) => a.map((v, j) => v + q[j] / 4), [0, 0, 0])
    if (dot(n, sub(EYE, centre)) <= 0) continue
    const light = Math.max(0, dot(n, LD))
    const shade = Math.min(1, 0.5 + 0.52 * light)
    out.push({ group, shade, top: n[1] > 0.9, pts: idx.map(i => project(k[i])), depth: project(centre)[2] })
  }
  return out
}
// shadow: the box projected on the floor along the light, as a convex hull
function hull(pts) {
  const s = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo = [], up = []
  for (const q of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q) }
  for (const q of s.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q) }
  return lo.slice(0, -1).concat(up.slice(0, -1))
}
function shadow(c, s, ry) {
  const g = boxCorners(c, s, ry).map(q => { const t = q[1] / LD[1]; return [q[0] - LD[0] * t, q[2] - LD[2] * t] })
  return { group: 0, shade: 1, pts: hull(g).map(([x, z]) => project([x, 0.002, z])) }
}

const bars = [BAR_ANGLE, -BAR_ANGLE].map(a => ({ c: [0, BAR_Y, FC], s: BAR, ry: a }))
const cubes = HEAD.map(([x, y, lv], i) => ({ c: [x, LEVEL[lv], -(y - FC)], s: CUBE, ry: 0, g: CUBE_GROUP[i], row: lv }))

const faces = []
for (const b of [...bars, ...cubes]) faces.push(shadow(b.c, b.s, b.ry))
// the X: sides of both bars first, then both tops (they cross at the same height)
const barFaces = bars.flatMap(b => boxFaces(b.c, b.s, b.ry, 1))
faces.push(...barFaces.filter(x => !x.top), ...barFaces.filter(x => x.top))
// the head, back row to front row; in a row, the sides before the centre
for (const row of [0, 1, 2]) {
  const rc = cubes.filter(q => q.row === row).sort((a, b) => (a.g === 4) - (b.g === 4))
  for (const q of rc) faces.push(...boxFaces(q.c, q.s, q.ry, q.g).sort((a, b) => b.depth - a.depth))
}

const r1 = v => Math.round(v * 10) / 10
const d = pts => 'M' + pts.map(q => `${r1(q[0])} ${r1(q[1])}`).join('L') + 'Z'
const out = faces.map(x => ({ group: x.group, shade: Math.round(x.shade * 255), d: d(x.pts) }))
fs.writeFileSync(path.join(__dirname, 'faces.json'), JSON.stringify(out, null, 1))

// preview with the logo's colours (yellow, top ink, centre purple, front pink)
const col = { 1: [15, 13, 10], 3: [15, 13, 10], 4: [149, 89, 187], 5: [252, 152, 202], 6: [252, 152, 202] }
const shadeHex = (c, s) => '#' + c.map(v => Math.round(Math.min(255, v * s / 255 + (255 - v) * 0.1 * s / 255)).toString(16).padStart(2, '0')).join('')
let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="600" height="600"><rect width="100" height="100" fill="#fbc500"/><g fill="#5a3c00" opacity="0.28">'
svg += out.filter(x => x.group === 0).map(x => `<path d="${x.d}"/>`).join('') + '</g>'
svg += out.filter(x => x.group > 0).map(x => `<path d="${x.d}" fill="${shadeHex(col[x.group], x.shade)}" stroke="${shadeHex(col[x.group], x.shade)}" stroke-width="0.35" stroke-linejoin="round"/>`).join('')
svg += '</svg>'
fs.writeFileSync(path.join(__dirname, 'preview.svg'), svg)
console.log(out.length, 'faces,', out.reduce((n, x) => n + x.d.length, 0), 'bytes of path data')
