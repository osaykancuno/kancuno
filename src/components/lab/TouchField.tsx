'use client'
// T.05 Touch Field: move the pointer over the 3D K and the blocks make way, with the
// home page's physics. Tune the effect, then record a clip or save a still.
import { useEffect, useRef, useState } from 'react'
import { useLab } from '@/lib/lab/store'
import { downloadBlob, slug } from '@/lib/lab/export'
import type { KRenderer, TouchMode, TouchOptions } from '@/lib/lab/k3d'
import { attachOrbit, CAM_DEFAULT, isDefaultCam, keyCam, type Cam, type Orbit } from '@/lib/lab/orbit'
import { Range, Section, Seg } from './controls'
import { useReducedMotion } from './KArt'
import { MintPanel } from './MintDialog'

const KEY = 'klab:touch:v1'
const DEFAULT: TouchOptions = { mode: 'push', radius: 1.9, strength: 1.1, ease: 6, parts: 'all', field: true }
const MODES: { value: TouchMode; label: string }[] = [
  { value: 'push', label: 'Push' },
  { value: 'lift', label: 'Lift' },
  { value: 'pull', label: 'Pull' },
  { value: 'ripple', label: 'Ripple' },
]
const RECIPES: { name: string; o: Partial<TouchOptions> }[] = [
  { name: 'Home feel', o: { mode: 'push', radius: 1.9, strength: 1.1, ease: 6 } },
  { name: 'Levitate', o: { mode: 'lift', radius: 2.2, strength: 1.2, ease: 4 } },
  { name: 'Magnet', o: { mode: 'pull', radius: 2.6, strength: 1, ease: 5 } },
  { name: 'Wave', o: { mode: 'ripple', radius: 2.4, strength: 1.2, ease: 8 } },
]

function load(): TouchOptions {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    const o = JSON.parse(raw) as Partial<TouchOptions>
    const num = (v: unknown, fb: number, a: number, b: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : fb)
    return {
      mode: MODES.some(m => m.value === o.mode) ? (o.mode as TouchMode) : DEFAULT.mode,
      radius: num(o.radius, DEFAULT.radius, 0.6, 4),
      strength: num(o.strength, DEFAULT.strength, 0.2, 2.5),
      ease: num(o.ease, DEFAULT.ease, 1, 16),
      parts: o.parts === 'head' || o.parts === 'body' ? o.parts : 'all',
      field: typeof o.field === 'boolean' ? o.field : true,
    }
  } catch {
    return DEFAULT
  }
}

export default function TouchField() {
  const { design, set: setDesign } = useLab()
  const reduce = useReducedMotion()
  const canvas = useRef<HTMLCanvasElement>(null)
  const r = useRef<KRenderer | null>(null)
  const [opts, setOpts] = useState<TouchOptions>(DEFAULT)
  const [demo, setDemo] = useState(true)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [status, setStatus] = useState('')
  const [recording, setRecording] = useState(0) // seconds left
  const [hand, setHand] = useState<'push' | 'turn'>('push') // what a one-finger drag does
  const orbit = useRef<Orbit | null>(null)
  const live = useRef({ design, opts, demo, reduce, hand, pointer: false, kx: 0, ky: 0, key: false, cam: null as Cam | null, dirty: true, rec: false })
  live.current = { ...live.current, design, opts, demo: demo && !reduce, reduce, hand }

  useEffect(() => { setOpts(load()) }, [])
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(opts)) } catch { /* private mode */ } }, [opts])
  useEffect(() => { r.current?.setTouch(opts); live.current.dirty = true }, [opts])
  // the store's view arrived (our commit, undo, another tool): drop the dragged one
  useEffect(() => { live.current.cam = null; live.current.dirty = true }, [design.cam])

  // Renderer + frame loop (only while the tab is visible)
  useEffect(() => {
    let alive = true
    let raf = 0
    let ro: ResizeObserver | null = null
    import('@/lib/lab/k3d').then(({ KRenderer }) => {
      if (!alive || !canvas.current) return
      let k: KRenderer
      try { k = new KRenderer(canvas.current) } catch { setFailed(true); return }
      r.current = k
      k.onAsset = () => { live.current.dirty = true; live.current.design = { ...live.current.design } }
      k.setTouch(live.current.opts)
      const fit = () => {
        const el = canvas.current
        if (el) k.setSize(Math.min(1600, (el.clientWidth || 512) * Math.min(window.devicePixelRatio || 1, 1.75)))
        live.current.dirty = true
      }
      ro = new ResizeObserver(fit)
      ro.observe(canvas.current)
      fit()
      setReady(true)
      let last = performance.now()
      let t = 0
      let shown: unknown = null
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame)
        if (document.hidden) { last = now; return }
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        const L = live.current
        if (!L.reduce) t += dt
        if (L.key) k.setPointerNdc(L.kx, L.ky, true)
        else if (!L.pointer && L.demo) {
          // a slow figure-of-eight around the K, so the effect shows by itself
          const a = t * 0.55
          k.setPointerNdc(Math.sin(a) * 0.62, Math.sin(a * 2) * 0.34 - 0.05, true)
        } else if (!L.pointer) k.setPointer(0, 0, false)
        const moved = k.step(dt)
        // Render only while something changes: settled blocks and a still K cost nothing
        const loops = L.design.anim.loops.length > 0 && !L.reduce
        if (moved < 1e-4 && !loops && !L.dirty && !L.rec && shown === L.design) return
        shown = L.design
        L.dirty = false
        k.render(L.design, t, { cam: L.cam })
      }
      raf = requestAnimationFrame(frame)
    })
    return () => { alive = false; cancelAnimationFrame(raf); ro?.disconnect(); r.current?.dispose(); r.current = null }
  }, [])

  const set = (o: Partial<TouchOptions>) => setOpts(p => ({ ...p, ...o }))
  const commitCam = (c: Cam) => setDesign(d => ({ ...d, cam: c }), 'cam')

  // Turning the K: Turn mode, right-drag, Shift+drag or two fingers; a one-finger drag pushes
  useEffect(() => {
    const el = canvas.current
    if (!el || !ready) return
    const o = attachOrbit(el, {
      get: () => live.current.cam ?? live.current.design.cam ?? CAM_DEFAULT,
      preview: c => { live.current.cam = c; live.current.dirty = true; live.current.pointer = false; r.current?.setPointer(0, 0, false) },
      commit: c => { live.current.cam = c; live.current.dirty = true; commitCam(c) },
      accept: (e, count) => live.current.hand === 'turn' || e.button === 2 || e.shiftKey || count >= 2,
      wheel: true,
    })
    orbit.current = o
    return () => { o.detach(); orbit.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])
  const pushes = (e: React.PointerEvent) => live.current.hand === 'push' && !e.shiftKey && e.buttons !== 2 && !orbit.current?.active()

  const onKey = (e: React.KeyboardEvent) => {
    const L = live.current
    const d = 0.08
    const moves: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }
    // Shift+arrows (or any arrow in Turn mode) turn the K; +/- zoom, 0 resets the view
    const turn = e.shiftKey || L.hand === 'turn' || !moves[e.key]
    const c = turn ? keyCam(L.cam ?? L.design.cam ?? CAM_DEFAULT, e.key) : null
    if (c) {
      e.preventDefault()
      L.cam = c
      L.dirty = true
      commitCam(c)
    } else if (moves[e.key]) {
      e.preventDefault()
      L.key = true
      L.kx = Math.max(-1, Math.min(1, L.kx + moves[e.key][0]))
      L.ky = Math.max(-1, Math.min(1, L.ky + moves[e.key][1]))
    } else if (e.key === 'Escape') {
      L.key = false
    }
  }

  const snapshot = async () => {
    const k = r.current
    if (!k) return
    try {
      k.render(live.current.design, 0, { cam: live.current.cam }) // render and read in the same task
      downloadBlob(await k.toBlob(), `${slug(design.name)}-touch.png`)
      setStatus('PNG saved.')
    } catch { setStatus('Could not save the PNG.') }
  }

  const record = async () => {
    const el = canvas.current
    if (!el || recording) return
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(m => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m))
    if (!mime || typeof el.captureStream !== 'function') { setStatus('This browser cannot record video.'); return }
    const stream = el.captureStream(30)
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 })
    const parts: Blob[] = []
    rec.ondataavailable = e => { if (e.data.size) parts.push(e.data) }
    const done = new Promise<void>(res => { rec.onstop = () => res(); rec.onerror = () => res() })
    rec.start(250)
    live.current.rec = true // keep drawing every frame so the clip runs smoothly
    setStatus('Recording 6 seconds. Move over K1N0.')
    for (let s = 6; s > 0; s--) { setRecording(s); await new Promise(res => setTimeout(res, 1000)) }
    rec.stop()
    live.current.rec = false
    stream.getTracks().forEach(t => t.stop())
    await done
    setRecording(0)
    if (!parts.length) { setStatus('Nothing was recorded.'); return }
    downloadBlob(new Blob(parts, { type: mime.split(';')[0] }), `${slug(design.name)}-touch.${mime.includes('mp4') ? 'mp4' : 'webm'}`)
    setStatus('Clip saved.')
  }

  return (
    <div className="lab-tool">
      <header className="lab-tool__head">
        <span className="lab-label">T.05</span>
        <h1 className="lab-tool__title">Touch Field</h1>
        <p className="lab-note">Move over K1N0. The blocks make way.</p>
      </header>

      <div className="lab-tool__stagewrap">
        <div className="lab-stage" style={{ background: design.bg.visible ? design.bg.fill.a : undefined }}>
          {failed ? (
            <p className="lab-note" style={{ padding: 24 }}>Touch Field needs WebGL, which this browser does not provide.</p>
          ) : (
            <canvas
              ref={canvas}
              className="lab-art__3d tf-canvas"
              data-ready={ready ? '' : undefined}
              tabIndex={0}
              role="application"
              aria-roledescription="touch field"
              aria-label={`Touch Field: K1N0 in 3D, ${opts.mode} mode. Move the pointer over it, or use the arrow keys.`}
              aria-describedby="tf-help"
              data-orbit="tool"
              data-hand={hand}
              onPointerMove={e => { if (!pushes(e)) return; live.current.pointer = true; live.current.key = false; r.current?.setPointer(e.clientX, e.clientY, true) }}
              onPointerDown={e => { if (!pushes(e)) return; live.current.pointer = true; live.current.key = false; r.current?.setPointer(e.clientX, e.clientY, true) }}
              onPointerLeave={() => { live.current.pointer = false; r.current?.setPointer(0, 0, false) }}
              onPointerCancel={() => { live.current.pointer = false; r.current?.setPointer(0, 0, false) }}
              onKeyDown={onKey}
              onBlur={() => { live.current.key = false }}
            />
          )}
          {recording > 0 && <span className="tf-rec" aria-hidden="true">● REC {recording}</span>}
        </div>
        <div className="lab-bar">
          <div className="lab-seg" role="group" aria-label="Drag">
            <button type="button" aria-pressed={hand === 'push'} onClick={() => setHand('push')}>Push</button>
            <button type="button" aria-pressed={hand === 'turn'} onClick={() => setHand('turn')}>Turn</button>
          </div>
          {!isDefaultCam(design.cam) && (
            <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => commitCam({ ...CAM_DEFAULT })}>Front view</button>
          )}
        </div>
        <p id="tf-help" className="lab-note" style={{ textAlign: 'center' }}>
          Drag pushes the blocks. Turn the K with Turn, right-drag, Shift+drag or two fingers; scroll to zoom.
          Keyboard: arrows move, Shift+arrows turn, Esc lets go.
        </p>
      </div>

      <div className="lab-controls">
        <Section title="Effect">
          <Seg label="Mode" value={opts.mode} options={MODES} onChange={mode => set({ mode })} />
          <Range label="Radius" min={0.6} max={4} step={0.1} value={opts.radius} format={v => v.toFixed(1)} onChange={radius => set({ radius })} />
          <Range label="Strength" min={0.2} max={2.5} step={0.05} value={opts.strength} format={v => v.toFixed(2)} onChange={strength => set({ strength })} />
          <Range label="Return" min={1} max={16} step={0.5} value={opts.ease} format={v => `${v.toFixed(1)}/s`} onChange={ease => set({ ease })} />
          <Seg label="Moves" value={opts.parts} options={[{ value: 'all', label: 'Whole figure' }, { value: 'head', label: 'Head' }, { value: 'body', label: 'Body' }]} onChange={parts => set({ parts })} />
          <label className="lab-check"><input type="checkbox" checked={opts.field} onChange={e => set({ field: e.target.checked })} /> Voxel field around K1N0</label>
          <label className="lab-check"><input type="checkbox" checked={demo && !reduce} disabled={reduce} onChange={e => setDemo(e.target.checked)} /> Demo when idle{reduce ? ' (off: reduced motion)' : ''}</label>
        </Section>

        <Section title="Recipes">
          <div className="lab-row">
            {RECIPES.map(x => (
              <button key={x.name} type="button" className="lab-btn lab-btn--sm" onClick={() => set(x.o)}>{x.name}</button>
            ))}
          </div>
          <p className="lab-note">“Home feel” is the exact push of the kancuno.com home page.</p>
        </Section>

        <Section title="Capture">
          <div className="lab-row">
            <button type="button" className="lab-btn lab-btn--primary" onClick={record} aria-disabled={recording > 0 || undefined}>
              {recording > 0 ? `Recording… ${recording}` : 'Record 6 s'}
            </button>
            <button type="button" className="lab-btn" onClick={snapshot}>PNG still</button>
          </div>
          <p className="lab-status" role="status">{status}</p>
          <p className="lab-note">K1N0 comes from your current design: change it in the K Editor or Pixel Forge (pixels become voxels here).</p>
          <MintPanel />
        </Section>
      </div>
    </div>
  )
}
