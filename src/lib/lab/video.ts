// Video export (WebM, or MP4 where that is all the browser offers). Browser only: call from event handlers.
import type { KDesign } from './design'
import { renderFrame } from './export'

const CANDIDATES: { mime: string; ext: string }[] = [
  { mime: 'video/webm;codecs=vp9', ext: 'webm' },
  { mime: 'video/webm;codecs=vp8', ext: 'webm' },
  { mime: 'video/webm', ext: 'webm' },
  { mime: 'video/mp4', ext: 'mp4' },
]

export function videoSupport(): { mime: string; ext: string } | null {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return null
  if (typeof HTMLCanvasElement === 'undefined' || typeof HTMLCanvasElement.prototype.captureStream !== 'function') return null
  if (typeof createImageBitmap !== 'function') return null
  return CANDIDATES.find(c => MediaRecorder.isTypeSupported(c.mime)) ?? null
}

export interface VideoOptions {
  size?: number
  loops?: number
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

function abortError() {
  const e = new Error('Export cancelled.')
  e.name = 'AbortError'
  return e
}

export async function exportVideo(design: KDesign, o: VideoOptions = {}): Promise<{ blob: Blob; ext: string }> {
  const support = videoSupport()
  if (!support) throw new Error('This browser cannot record video. Use GIF instead.')
  const loops = o.loops ?? 2
  const period = design.anim.period
  const frames = Math.max(2, Math.min(240, Math.round(period * 30)))
  // Pre-rendered frames are size²·4 bytes each: keep the whole set under ~256 MB
  const size = Math.min(o.size ?? 720, Math.floor(Math.sqrt(256e6 / (frames * 4)) / 2) * 2)
  const fps = frames / period // exact loop length
  const report = (f: number) => o.onProgress?.(Math.min(1, Math.max(0, f)))
  const bitmaps: ImageBitmap[] = []
  let stream: MediaStream | undefined
  let rec: MediaRecorder | undefined

  try {
    // 1. Pre-render every frame so playback timing is not limited by rasterising
    const scratch = document.createElement('canvas')
    for (let i = 0; i < frames; i++) {
      if (o.signal?.aborted) throw abortError()
      await renderFrame(design, i / fps, size, scratch)
      bitmaps.push(await createImageBitmap(scratch))
      report((i + 1) / frames * 0.5)
      if (i % 4 === 3) await wait(0)
    }

    // 2. Play them into a recording canvas on a steady clock
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    const draw = (i: number) => {
      ctx.fillStyle = '#0d0b08'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(bitmaps[i], 0, 0, size, size)
    }
    draw(0)

    stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType: support.mime, videoBitsPerSecond: 8_000_000 })
    const parts: Blob[] = []
    rec = recorder
    recorder.ondataavailable = e => { if (e.data.size > 0) parts.push(e.data) }
    const stopped = new Promise<void>((res, rej) => {
      recorder.onstop = () => res()
      recorder.onerror = () => rej(new Error('Video recording failed.'))
    })
    stopped.catch(() => undefined) // avoid an unhandled rejection if we leave early
    recorder.start(250)

    const total = frames * loops
    const startAt = performance.now()
    let shown = -1
    await new Promise<void>((resolve, reject) => {
      const tick = () => {
        if (o.signal?.aborted) { reject(abortError()); return }
        const idx = Math.floor(((performance.now() - startAt) / 1000) * fps)
        if (idx >= total) { resolve(); return }
        if (idx !== shown) {
          shown = idx
          draw(idx % frames)
          report(0.5 + (idx / total) * 0.5)
        }
        setTimeout(tick, 1000 / (fps * 2))
      }
      tick()
    })
    await wait(1000 / 30 + 20) // let the last frame reach the recorder
    if (recorder.state !== 'inactive') recorder.stop()
    stream.getTracks().forEach(t => t.stop())
    await stopped
    report(1)
    return { blob: new Blob(parts, { type: support.mime.split(';')[0] }), ext: support.ext }
  } finally {
    if (rec && rec.state !== 'inactive') rec.stop()
    stream?.getTracks().forEach(t => t.stop())
    bitmaps.forEach(b => b.close())
  }
}
