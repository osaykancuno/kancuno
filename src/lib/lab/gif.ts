// Small GIF89a encoder: global palette, LZW, infinite loop. No dependencies, no DOM.
// Frames are requested twice (pass 1 builds the palette, pass 2 encodes) so memory stays flat.

export interface GifOptions {
  width: number
  height: number
  frames: number
  fps: number // may be fractional (frames / period)
  getFrame: (index: number) => Promise<Uint8ClampedArray> | Uint8ClampedArray // RGBA, width*height*4
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

const yieldToLoop = () => new Promise<void>(r => setTimeout(r, 0))

function abortCheck(signal?: AbortSignal) {
  if (signal?.aborted) {
    const e = new Error('Export cancelled.')
    e.name = 'AbortError'
    throw e
  }
}

const keyOf = (r: number, g: number, b: number) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)

class ByteSink {
  private chunks: Uint8Array[] = []
  private cur = new Uint8Array(65536)
  private len = 0
  byte(b: number) {
    if (this.len === this.cur.length) this.flush()
    this.cur[this.len++] = b
  }
  word(w: number) {
    this.byte(w & 255)
    this.byte((w >> 8) & 255)
  }
  bytes(a: ArrayLike<number>) {
    for (let i = 0; i < a.length; i++) this.byte(a[i])
  }
  ascii(s: string) {
    for (let i = 0; i < s.length; i++) this.byte(s.charCodeAt(i))
  }
  private flush() {
    this.chunks.push(this.cur.slice(0, this.len))
    this.len = 0
  }
  done(): Uint8Array {
    this.flush()
    let total = 0
    for (const c of this.chunks) total += c.length
    const out = new Uint8Array(total)
    let o = 0
    for (const c of this.chunks) { out.set(c, o); o += c.length }
    return out
  }
}

// LZW with minimum code size 8, written as GIF sub-blocks
function lzw(indices: Uint8Array, sink: ByteSink) {
  const CLEAR = 256
  const EOI = 257
  const block: number[] = []
  const flushBlock = () => {
    sink.byte(block.length)
    for (let i = 0; i < block.length; i++) sink.byte(block[i])
    block.length = 0
  }
  let acc = 0
  let bits = 0
  let size = 9
  let next = 258
  const dict = new Map<number, number>()

  const write = (code: number) => {
    acc |= code << bits
    bits += size
    while (bits >= 8) {
      block.push(acc & 255)
      acc >>>= 8
      bits -= 8
      if (block.length === 255) flushBlock()
    }
  }
  const emit = (code: number) => {
    write(code)
    if (next > (1 << size) - 1 && size < 12) size++
  }

  sink.byte(8)
  write(CLEAR)
  let prefix = indices[0]
  for (let i = 1; i < indices.length; i++) {
    const c = indices[i]
    const key = (prefix << 8) | c
    const found = dict.get(key)
    if (found !== undefined) { prefix = found; continue }
    emit(prefix)
    if (next < 4096) {
      dict.set(key, next++)
    } else {
      write(CLEAR)
      dict.clear()
      next = 258
      size = 9
    }
    prefix = c
  }
  emit(prefix)
  write(EOI)
  if (bits > 0) { block.push(acc & 255); acc = 0; bits = 0 }
  if (block.length) flushBlock()
  sink.byte(0)
}

export async function encodeGif(o: GifOptions): Promise<Uint8Array> {
  const { width, height, frames, fps } = o
  const report = (f: number) => o.onProgress?.(Math.min(1, Math.max(0, f)))

  // Pass 1: histogram on 5-bit keys, remembering the true average colour of each key
  const count = new Uint32Array(32768)
  const sr = new Float64Array(32768)
  const sg = new Float64Array(32768)
  const sb = new Float64Array(32768)
  for (let f = 0; f < frames; f++) {
    abortCheck(o.signal)
    const px = await o.getFrame(f)
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2]
      const k = keyOf(r, g, b)
      count[k]++
      sr[k] += r; sg[k] += g; sb[k] += b
    }
    report(((f + 1) / frames) * 0.4)
    await yieldToLoop()
  }

  const used: number[] = []
  for (let k = 0; k < 32768; k++) if (count[k] > 0) used.push(k)
  used.sort((a, b) => count[b] - count[a])
  const top = used.slice(0, 256)
  const palette = new Uint8Array(256 * 3)
  const keyToIndex = new Int16Array(32768).fill(-1)
  const avg = (k: number): [number, number, number] => [sr[k] / count[k], sg[k] / count[k], sb[k] / count[k]]
  const pal: [number, number, number][] = []
  top.forEach((k, i) => {
    const [r, g, b] = avg(k)
    palette[i * 3] = Math.round(r); palette[i * 3 + 1] = Math.round(g); palette[i * 3 + 2] = Math.round(b)
    pal.push([r, g, b])
    keyToIndex[k] = i
  })
  const nearest = (k: number): number => {
    const [r, g, b] = avg(k)
    let best = 0
    let bd = Infinity
    for (let i = 0; i < pal.length; i++) {
      const dr = pal[i][0] - r, dg = pal[i][1] - g, db = pal[i][2] - b
      const d = dr * dr + dg * dg + db * db
      if (d < bd) { bd = d; best = i }
    }
    return best
  }

  // Header, logical screen, global palette, loop extension
  const sink = new ByteSink()
  sink.ascii('GIF89a')
  sink.word(width)
  sink.word(height)
  sink.byte(0xf7) // global table, 8 bits, 256 entries
  sink.byte(0)
  sink.byte(0)
  sink.bytes(palette)
  sink.byte(0x21); sink.byte(0xff); sink.byte(11)
  sink.ascii('NETSCAPE2.0')
  sink.byte(3); sink.byte(1); sink.word(0); sink.byte(0)

  // Pass 2: encode each frame
  const idx = new Uint8Array(width * height)
  let prevCs = 0
  for (let f = 0; f < frames; f++) {
    abortCheck(o.signal)
    const px = await o.getFrame(f)
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      const k = keyOf(px[i], px[i + 1], px[i + 2])
      let v = keyToIndex[k]
      if (v < 0) { v = nearest(k); keyToIndex[k] = v }
      idx[p] = v
    }
    const cs = Math.round(((f + 1) * 100) / fps)
    const delay = Math.max(2, cs - prevCs)
    prevCs = cs
    sink.byte(0x21); sink.byte(0xf9); sink.byte(4)
    sink.byte(0x04) // disposal: leave in place, no transparency
    sink.word(delay)
    sink.byte(0); sink.byte(0)
    sink.byte(0x2c)
    sink.word(0); sink.word(0); sink.word(width); sink.word(height)
    sink.byte(0)
    lzw(idx, sink)
    report(0.4 + ((f + 1) / frames) * 0.6)
    await yieldToLoop()
  }
  sink.byte(0x3b)
  return sink.done()
}
