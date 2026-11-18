// Browser-only export helpers (call from event handlers, never during render).
import type { KDesign } from './design'
import { renderSvg } from './render'

export const slug = (name: string) =>
  'k-lab-' + (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design')

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export const downloadText = (text: string, filename: string, type: string) =>
  downloadBlob(new Blob([text], { type }), filename)

// Rasterise an SVG string onto a canvas (size x size px)
export async function svgToCanvas(svg: string, size: number, canvas?: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const c = canvas ?? document.createElement('canvas')
  c.width = size
  c.height = size
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.width = size
    img.height = size
    img.src = url
    await img.decode()
    // Exports read pixels back (GIF, video frames): keep the canvas CPU-side so getImageData is fast
    const ctx = c.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, size, size)
    return c
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const canvasToBlob = (c: HTMLCanvasElement, type = 'image/png') =>
  new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Export failed.'))), type))

// One frame of a design at time t onto a 2D canvas (size x size): the 3D clay K or the flat mark.
// GIF, video and PNG exports all go through here, so they always match the preview.
export async function renderFrame(d: KDesign, t: number, size: number, canvas?: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  if (d.view !== '3d') return svgToCanvas(renderSvg(d, { size, t, uid: 'x' }), size, canvas)
  const c = canvas ?? document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas is not available in this browser.')
  const { withShared } = await import('./k3d')
  await withShared(async r => {
    await r.prepare(d) // the Image Wrap picture must be decoded before the frame is drawn
    r.setSize(size)
    r.render(d, t)
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(r.canvas, 0, 0, size, size) // same task as render: the WebGL buffer is still there
  })
  return c
}

export async function exportPng(d: KDesign, size = 2048, t = 0) {
  const c = await renderFrame(d, t, size)
  downloadBlob(await canvasToBlob(c), `${slug(d.name)}.png`)
}

// The 3D figure as a GLB model (for AR, 3D apps, or an on-chain/IPFS mint later)
export async function exportGlb(d: KDesign) {
  const { withShared } = await import('./k3d')
  const blob = await withShared(r => r.exportGLB({ ...d, view: '3d' }))
  downloadBlob(blob, `${slug(d.name)}.glb`)
}

export function exportSvg(d: KDesign, t = 0) {
  downloadText(renderSvg(d, { size: 1024, t, uid: 'k' }), `${slug(d.name)}.svg`, 'image/svg+xml')
}

export function exportJson(d: KDesign) {
  downloadText(JSON.stringify(d, null, 2), `${slug(d.name)}.k.json`, 'application/json')
}
