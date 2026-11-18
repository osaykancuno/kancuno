// The downloadable base files of the K framework, generated from the same geometry as the tools.
import { BRAND } from './base'
import { defaultDesign, makeDesign, presetGrid, type KDesign } from './design'
import { renderSvg } from './render'

export const wireframeDesign = (): KDesign =>
  makeDesign({
    name: 'K wireframe',
    bg: { visible: false },
    body: { line: true, fill: { kind: 'solid', a: BRAND.ink } },
    head: { line: true, cubes: Array(7).fill(BRAND.ink) },
  })

export const BASE_FILES = [
  { id: 'svg', label: 'Base K', ext: 'SVG', file: 'k-lab-base.svg', type: 'image/svg+xml', note: 'The flat K, vector, 1024 px.' },
  { id: 'wire', label: 'Wireframe', ext: 'SVG', file: 'k-lab-wireframe.svg', type: 'image/svg+xml', note: 'Outlines only, transparent.' },
  { id: 'grid', label: 'Pixel grid', ext: 'JSON', file: 'k-lab-pixel-grid-32.json', type: 'application/json', note: 'The K on a 32×32 grid.' },
  { id: 'design', label: 'Starter design', ext: 'JSON', file: 'k-lab-starter.k.json', type: 'application/json', note: 'Load it in any K.LAB tool.' },
] as const

export type BaseFileId = (typeof BASE_FILES)[number]['id']

export function baseFile(id: BaseFileId): string {
  switch (id) {
    case 'svg': return renderSvg(defaultDesign(), { size: 1024, uid: 'k' })
    case 'wire': return renderSvg(wireframeDesign(), { size: 1024, uid: 'k' })
    case 'grid': return JSON.stringify({ size: 32, cells: presetGrid(32) })
    case 'design': return JSON.stringify(defaultDesign(), null, 2)
  }
}
