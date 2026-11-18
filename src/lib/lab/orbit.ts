// Orbit the 3D K: drag to turn around it, wheel or pinch to zoom, double-click to reset.
// Plain numbers only (no three.js): the controller just produces a Cam, which the
// renderer reads (design.cam), so stills, GIFs and videos keep the view that was chosen.

export interface Cam {
  yaw: number // degrees around the K, 0 = from the front
  pitch: number // degrees above the floor, 90 = straight down
  zoom: number // 1 = the home page framing
}

export const CAM_DEFAULT: Cam = { yaw: 0, pitch: 74, zoom: 1 }
const PITCH_MIN = 22
const PITCH_MAX = 89
const ZOOM_MIN = 0.6
const ZOOM_MAX = 1.9

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function clampCam(c: Cam): Cam {
  return {
    yaw: Math.round(((((c.yaw + 180) % 360) + 360) % 360 - 180) * 10) / 10,
    pitch: Math.round(clamp(c.pitch, PITCH_MIN, PITCH_MAX) * 10) / 10,
    zoom: Math.round(clamp(c.zoom, ZOOM_MIN, ZOOM_MAX) * 100) / 100,
  }
}

export const camEq = (a: Cam, b: Cam) => Math.abs(a.yaw - b.yaw) < 0.05 && Math.abs(a.pitch - b.pitch) < 0.05 && Math.abs(a.zoom - b.zoom) < 0.005
export const isDefaultCam = (c: Cam) => camEq(c, CAM_DEFAULT)

// Keyboard orbit: arrows turn, +/- zoom, 0 resets. Returns null for other keys.
export function keyCam(c: Cam, key: string): Cam | null {
  const s = 6
  switch (key) {
    case 'ArrowLeft': return clampCam({ ...c, yaw: c.yaw - s })
    case 'ArrowRight': return clampCam({ ...c, yaw: c.yaw + s })
    case 'ArrowUp': return clampCam({ ...c, pitch: c.pitch + s })
    case 'ArrowDown': return clampCam({ ...c, pitch: c.pitch - s })
    case '+': case '=': return clampCam({ ...c, zoom: c.zoom * 1.1 })
    case '-': case '_': return clampCam({ ...c, zoom: c.zoom / 1.1 })
    case '0': return { ...CAM_DEFAULT }
    default: return null
  }
}

export interface OrbitOptions {
  get: () => Cam
  preview: (c: Cam) => void // while the gesture runs (render directly, no React state)
  commit: (c: Cam) => void // once, when it ends
  // Which presses start an orbit; `count` is the number of pointers down, this one included
  accept?: (e: PointerEvent, count: number) => boolean
  tap?: (e: PointerEvent) => void // a press that did not move (e.g. picking a part)
  wheel?: boolean // wheel zoom (tools only: on the landing the wheel scrolls the page)
}

export interface Orbit {
  active: () => boolean
  detach: () => void
}

export function attachOrbit(el: HTMLElement, o: OrbitOptions): Orbit {
  const pts = new Map<number, { x: number; y: number }>()
  let cur: Cam | null = null
  let moved = false
  let downX = 0
  let downY = 0
  let pinch = 0 // distance between two pointers at the last move
  let wheelTimer = 0
  let wheelCam: Cam | null = null

  const centroid = () => {
    let x = 0
    let y = 0
    pts.forEach(p => { x += p.x; y += p.y })
    return { x: x / pts.size, y: y / pts.size }
  }
  const spread = () => {
    const [a, b] = [...pts.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }

  const down = (e: PointerEvent) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (!cur) {
      if (o.accept && !o.accept(e, pts.size)) return // still counted, so a second finger can start it
      cur = { ...o.get() }
      moved = false
      downX = e.clientX
      downY = e.clientY
    }
    try { el.setPointerCapture(e.pointerId) } catch { /* pointer already gone */ }
    if (pts.size === 2) { pinch = spread(); moved = true }
  }

  const move = (e: PointerEvent) => {
    const p = pts.get(e.pointerId)
    if (!p) return
    const before = centroid()
    const gap = pts.size >= 2 ? spread() : 0
    p.x = e.clientX
    p.y = e.clientY
    if (!cur) return
    const after = centroid()
    const w = Math.max(240, el.clientWidth)
    const k = 360 / w // degrees per pixel before damping: a stage width is about half a turn
    let next: Cam = { ...cur, yaw: cur.yaw - (after.x - before.x) * k * 0.6, pitch: cur.pitch + (after.y - before.y) * k * 0.4 }
    if (pts.size >= 2 && gap > 0 && pinch > 0) {
      const now = spread()
      next = { ...next, zoom: next.zoom * (now / pinch) }
      pinch = now
    }
    if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) > 5) moved = true
    if (!moved) return
    cur = clampCam(next)
    o.preview(cur)
  }

  const up = (e: PointerEvent) => {
    if (!pts.has(e.pointerId)) return
    pts.delete(e.pointerId)
    if (pts.size === 1) pinch = 0
    if (pts.size > 0 || !cur) return
    const done = cur
    cur = null
    if (moved) o.commit(done)
    else if (e.type === 'pointerup') o.tap?.(e)
  }

  const wheel = (e: WheelEvent) => {
    if (!o.wheel) return
    e.preventDefault()
    const base = wheelCam ?? o.get()
    wheelCam = clampCam({ ...base, zoom: base.zoom * Math.exp(-e.deltaY * 0.0015) })
    o.preview(wheelCam)
    clearTimeout(wheelTimer)
    wheelTimer = window.setTimeout(() => { if (wheelCam) o.commit(wheelCam); wheelCam = null }, 220)
  }

  const dbl = () => { o.preview({ ...CAM_DEFAULT }); o.commit({ ...CAM_DEFAULT }) }
  const menu = (e: Event) => { if (cur || o.accept) e.preventDefault() } // right-drag orbits where allowed

  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  el.addEventListener('wheel', wheel, { passive: false })
  el.addEventListener('dblclick', dbl)
  el.addEventListener('contextmenu', menu)
  return {
    active: () => !!cur && moved,
    detach: () => {
      clearTimeout(wheelTimer)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('dblclick', dbl)
      el.removeEventListener('contextmenu', menu)
    },
  }
}
