// Image Wrap: a picture of the visitor's choice printed on the 3D K.
// Everything happens in this browser: the file is decoded, scaled down and kept in the
// design as a data URL (never uploaded). No three.js here: the renderer and the tool share it.
import { BRAND } from './base'

export type ImageTarget = 'all' | 'head' | 'body'
export type ImageMode = 'print' | 'tile' // print: one picture across the K seen from above; tile: on every block
export type ImagePalette = 'off' | 'brand' | 'duo'

export interface KImage {
  src: string // data:image/(webp|png|jpeg);base64,…
  w: number // pixel size of src
  h: number
  target: ImageTarget
  mode: ImageMode
  fit: 'cover' | 'contain'
  zoom: number // 1 = fit
  x: number // -1..1, pan (fraction of the frame)
  y: number
  rot: number // degrees
  bright: number // -1..1
  contrast: number // -1..1
  sat: number // 0..2
  palette: ImagePalette // map every pixel to the brand colours (keeps the K on-brand)
}

export const IMAGE_DEFAULT: Omit<KImage, 'src' | 'w' | 'h'> = {
  target: 'head', mode: 'print', fit: 'cover', zoom: 1, x: 0, y: 0, rot: 0, bright: 0, contrast: 0, sat: 1, palette: 'off',
}

export const IMAGE_MAX_SIDE = 1024
export const IMAGE_MAX_DATA = 2_200_000 // characters of data URL kept in a design
const DATA_URL = /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/]+=*$/
export const isImageSrc = (v: unknown): v is string => typeof v === 'string' && v.length <= IMAGE_MAX_DATA && DATA_URL.test(v)

// ── Import: any browser-decodable image → a light data URL ────────────────────
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/bmp']
export const IMAGE_ACCEPT = ACCEPT.join(',')

export async function importImage(file: Blob): Promise<{ src: string; w: number; h: number }> {
  if (file.type && !ACCEPT.includes(file.type)) throw new Error('Use a PNG, JPG, WebP, GIF or AVIF image.')
  if (file.size > 30 * 1024 * 1024) throw new Error('This image is over 30 MB. Try a smaller one.')
  let bmp: ImageBitmap | HTMLImageElement
  try {
    bmp = await createImageBitmap(file)
  } catch {
    // older Safari: decode through an <img>
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      bmp = img
    } catch {
      throw new Error('This file could not be read as an image.')
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  const iw = 'naturalWidth' in bmp ? bmp.naturalWidth : bmp.width
  const ih = 'naturalHeight' in bmp ? bmp.naturalHeight : bmp.height
  if (!iw || !ih) throw new Error('This image is empty.')
  const k = Math.min(1, IMAGE_MAX_SIDE / Math.max(iw, ih))
  const w = Math.max(1, Math.round(iw * k))
  const h = Math.max(1, Math.round(ih * k))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.imageSmoothingQuality = 'high'
  g.drawImage(bmp, 0, 0, w, h)
  if ('close' in bmp) bmp.close()
  // WebP keeps transparency and is small; browsers without a WebP encoder return PNG
  let src = c.toDataURL('image/webp', 0.9)
  if (!src.startsWith('data:image/webp') || src.length > IMAGE_MAX_DATA) {
    const hasAlpha = (() => {
      const d = g.getImageData(0, 0, w, h).data
      for (let i = 3; i < d.length; i += 16) if (d[i] < 250) return true
      return false
    })()
    src = hasAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.9)
    if (src.length > IMAGE_MAX_DATA) src = c.toDataURL('image/jpeg', 0.8)
  }
  if (!isImageSrc(src)) throw new Error('This image is too detailed to keep. Try a smaller one.')
  return { src, w, h }
}

// ── Decoded images, shared by every renderer on the page ──────────────────────
const cache = new Map<string, HTMLImageElement>()
const pending = new Map<string, Promise<HTMLImageElement>>()

export function loadedImage(src: string): HTMLImageElement | null {
  return cache.get(src) ?? null
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = cache.get(src)
  if (hit) return Promise.resolve(hit)
  let p = pending.get(src)
  if (!p) {
    p = (async () => {
      if (!isImageSrc(src)) throw new Error('Not a K.LAB image.')
      const img = new Image()
      img.src = src
      await img.decode()
      if (cache.size > 6) cache.clear() // a few designs at most: drop old pictures
      cache.set(src, img)
      pending.delete(src)
      return img
    })()
    p.catch(() => pending.delete(src))
    pending.set(src, p)
  }
  return p
}

// ── Compose: the picture framed for a region of the K, adjusted, onto a canvas ──
const BRAND_PAL = [BRAND.ink, BRAND.yellow, BRAND.pink, BRAND.purple, BRAND.cream].map(hexRgb)
function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// w x h px; `under` fills what the picture does not cover (contain, panning, transparency)
export function composeImage(img: CanvasImageSource & { width: number; height: number }, o: KImage, w: number, h: number, under: string, duo: [string, string] = [BRAND.ink, BRAND.yellow]): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.fillStyle = under
  g.fillRect(0, 0, c.width, c.height)
  const iw = o.w || img.width
  const ih = o.h || img.height
  const base = o.fit === 'cover' ? Math.max(c.width / iw, c.height / ih) : Math.min(c.width / iw, c.height / ih)
  const k = base * o.zoom
  g.save()
  g.translate(c.width / 2 + (o.x * c.width) / 2, c.height / 2 + (o.y * c.height) / 2)
  g.rotate((o.rot * Math.PI) / 180)
  g.imageSmoothingQuality = 'high'
  g.drawImage(img, (-iw * k) / 2, (-ih * k) / 2, iw * k, ih * k)
  g.restore()
  adjust(g, c.width, c.height, o, duo)
  return c
}

function adjust(g: CanvasRenderingContext2D, w: number, h: number, o: KImage, duo: [string, string]) {
  const plain = o.bright === 0 && o.contrast === 0 && o.sat === 1 && o.palette === 'off'
  if (plain) return
  const im = g.getImageData(0, 0, w, h)
  const d = im.data
  const b = o.bright * 255 * 0.5
  const ct = o.contrast >= 0 ? 1 + o.contrast * 2 : 1 + o.contrast // 0..3
  const [d0, d1] = [hexRgb(duo[0]), hexRgb(duo[1])]
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i]
    let gg = d[i + 1]
    let bb = d[i + 2]
    const l = 0.2126 * r + 0.7152 * gg + 0.0722 * bb
    r = l + (r - l) * o.sat
    gg = l + (gg - l) * o.sat
    bb = l + (bb - l) * o.sat
    r = (r - 128) * ct + 128 + b
    gg = (gg - 128) * ct + 128 + b
    bb = (bb - 128) * ct + 128 + b
    if (o.palette === 'brand') {
      let best = 0
      let bd = Infinity
      for (let p = 0; p < BRAND_PAL.length; p++) {
        const q = BRAND_PAL[p]
        // weighted RGB distance: close to perceived difference, cheap
        const dist = 2 * (r - q[0]) ** 2 + 4 * (gg - q[1]) ** 2 + 3 * (bb - q[2]) ** 2
        if (dist < bd) { bd = dist; best = p }
      }
      ;[r, gg, bb] = BRAND_PAL[best]
    } else if (o.palette === 'duo') {
      const t = Math.min(1, Math.max(0, (0.2126 * r + 0.7152 * gg + 0.0722 * bb) / 255))
      r = d0[0] + (d1[0] - d0[0]) * t
      gg = d0[1] + (d1[1] - d0[1]) * t
      bb = d0[2] + (d1[2] - d0[2]) * t
    }
    d[i] = r
    d[i + 1] = gg
    d[i + 2] = bb
  }
  g.putImageData(im, 0, 0)
}
