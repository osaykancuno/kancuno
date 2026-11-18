// The K4NCUN0 figure as plain numbers: one source for the home world (formations.ts)
// and THE K.LAB (lib/lab/layout3d.ts). No three.js here, so the Lab's 2D tools can use it.
// Logo 2D coordinates: x right, y up, the X crossing at 0,0; unit = one head cube.

export const BAR_SIZE: [number, number, number] = [3.62, 0.62, 1.0] // length, thickness, width
export const CUBE_SIZE: [number, number, number] = [1, 0.8, 1]      // width, height, depth
export const BAR_ANGLE = (47.5 * Math.PI) / 180
export const BAR_Y = BAR_SIZE[1] / 2 + 0.04

// The head: the 2-3-2 brick of the logo, set low on the X and a little apart (2026-11-18,
// was pitch 1.08, rows 0.61, heights 0.44/0.74/1.06), so that when the blocks move (touch,
// effects) they still read as a figure and not as a heap piled on the X.
const PITCH = 1.24 // between cubes in a row (cube width 1: a 0.24 gap)
const ROW = 0.82 // between rows (cube depth 1: rows overlap a little, like the brick)
const FRONT = 1.22 // 2D y of the front row, close to the crossing of the X
export const HEAD_POS = [
  { x: -PITCH / 2, y: FRONT + ROW * 2, level: 0 },
  { x: PITCH / 2, y: FRONT + ROW * 2, level: 0 },
  { x: -PITCH, y: FRONT + ROW, level: 1 },
  { x: 0, y: FRONT + ROW, level: 1 },
  { x: PITCH, y: FRONT + ROW, level: 1 },
  { x: -PITCH / 2, y: FRONT, level: 2 },
  { x: PITCH / 2, y: FRONT, level: 2 },
] as const
export const LEVEL = [0.4, 0.5, 0.62] // cube centre heights: back, middle, front row (cube height 0.8)
export const FLAT_CENTER = 0.56 // 2D y of the figure's visual centre, so it sits centred
