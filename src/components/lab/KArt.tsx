'use client'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type { KDesign, PartId } from '@/lib/lab/design'
import { renderSvg, svgDataUrl } from '@/lib/lab/render'
import type { KRenderer } from '@/lib/lab/k3d'
import { attachOrbit, CAM_DEFAULT, camEq, keyCam, type Cam } from '@/lib/lab/orbit'

// Live prefers-reduced-motion (follows changes while the page is open)
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduce(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduce
}

// Loop clock: runs only while asked, on screen and with the tab visible
function useLoopTime(ref: React.RefObject<HTMLElement | null>, run: boolean): number {
  const [t, setT] = useState(0)
  const [onScreen, setOnScreen] = useState(true)
  const [tabVisible, setTabVisible] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting))
    io.observe(el)
    const vis = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', vis)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis) }
  }, [ref])
  const playing = run && onScreen && tabVisible
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = 0
    const start = performance.now() - t * 1000 // resume where it stopped
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (now - last < 1000 / 30) return // 30 fps is plenty for the loops
      last = now
      setT((now - start) / 1000)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])
  return t
}

const bgColour = (d: KDesign) => (d.bg.visible ? d.bg.fill.a : undefined)

interface PreviewProps {
  design: KDesign
  uid?: string
  selected?: PartId | null
  onPick?: (part: PartId | 'pixels') => void
  animate?: boolean
  paused?: boolean
  forceMotion?: boolean // the visitor pressed Play: animate even under reduced motion
  time?: number // fixed time (scrubbing), overrides the clock
  label?: string
  // 3D only. With onCam the view is part of the design (tools: exports keep it);
  // orbit alone turns the view locally (the landing hero).
  orbit?: boolean
  onCam?: (c: Cam) => void
}

// Live preview of a design: the 3D clay K (default) or the flat mark, by design.view.
export function KPreview(props: PreviewProps) {
  const { design, animate = false, paused = false, forceMotion = false, time } = props
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const d = useDeferredValue(design) // controls stay responsive while the preview catches up
  const run = animate && !paused && (!reduce || forceMotion) && time === undefined && d.anim.loops.length > 0
  const clock = useLoopTime(ref, run)
  const t = time ?? (animate && (!reduce || forceMotion) ? clock : 0)
  return (
    <div ref={ref} className="lab-art" role="img" aria-label={props.label ?? `${design.name}, a K1N0 design`} style={{ background: bgColour(d) }}>
      {d.view === '3d'
        ? <K3D design={d} t={t} selected={props.selected} onPick={props.onPick} orbit={props.orbit || !!props.onCam} onCam={props.onCam} />
        : <KFlat design={d} t={t} uid={props.uid} selected={props.selected} onPick={props.onPick} />}
    </div>
  )
}

function KFlat({ design, t, uid = 'kp', selected, onPick }: { design: KDesign; t: number; uid?: string; selected?: PartId | null; onPick?: (p: PartId | 'pixels') => void }) {
  // The renderer escapes every value, so the markup is safe to inject
  const svg = useMemo(() => renderSvg(design, { uid, t, selected, interactive: !!onPick }), [design, uid, t, selected, onPick])
  return (
    <div
      className="lab-art__flat"
      // pointerdown, not click: the SVG is replaced every frame while animating
      onPointerDown={onPick ? e => {
        const el = (e.target as Element).closest('[data-part]')
        const p = el?.getAttribute('data-part') as PartId | 'pixels' | null
        if (p) onPick(p)
      } : undefined}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

interface K3DProps {
  design: KDesign
  t: number
  selected?: PartId | null
  onPick?: (p: PartId | 'pixels') => void
  orbit?: boolean
  onCam?: (c: Cam) => void
}

function K3D({ design, t, selected, onPick, orbit = false, onCam }: K3DProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const r = useRef<KRenderer | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const latest = useRef({ design, t, selected, onPick, onCam })
  latest.current = { design, t, selected, onPick, onCam }
  // The view being dragged (or, without onCam, the visitor's own view): it wins over design.cam
  const view = useRef<Cam | null>(null)
  const seenCam = useRef<Cam>(design.cam ?? CAM_DEFAULT)

  const draw = () => {
    const L = latest.current
    r.current?.render(L.design, L.t, { selected: L.selected, cam: view.current })
  }

  useEffect(() => {
    let alive = true
    let ro: ResizeObserver | null = null
    import('@/lib/lab/k3d').then(({ KRenderer }) => {
      if (!alive || !canvas.current) return
      try {
        const k = new KRenderer(canvas.current)
        r.current = k
        k.onAsset = draw // the Image Wrap picture decoded: draw it
        const fit = () => {
          const el = canvas.current
          if (!el) return
          const w = el.clientWidth || 512
          // 1.75x is sharp on retina and far cheaper than 2x for the bloom and shadow passes
          k.setSize(Math.min(1600, w * Math.min(window.devicePixelRatio || 1, 1.75)))
          draw()
        }
        ro = new ResizeObserver(fit)
        ro.observe(canvas.current)
        fit()
        setReady(true)
      } catch {
        setFailed(true) // no WebGL: fall back to the flat mark
      }
    })
    return () => { alive = false; ro?.disconnect(); r.current?.dispose(); r.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // The store's camera changed (our own commit, undo, a preset, reset): it takes over again
    const dc = design.cam ?? CAM_DEFAULT
    if (latest.current.onCam && !camEq(dc, seenCam.current)) {
      seenCam.current = dc
      view.current = null
    }
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, t, selected, ready])

  // Drag to turn around the K, wheel or pinch to zoom, double-click to reset; a click still picks
  useEffect(() => {
    const el = canvas.current
    if (!el || !ready || !orbit) return
    const o = attachOrbit(el, {
      get: () => view.current ?? latest.current.design.cam ?? CAM_DEFAULT,
      preview: c => { view.current = c; draw() },
      commit: c => {
        view.current = c
        draw()
        latest.current.onCam?.(c)
      },
      tap: e => {
        const pick = latest.current.onPick
        const p = pick && r.current?.pick(e.clientX, e.clientY)
        if (pick && p) pick(p)
      },
      wheel: !!latest.current.onCam,
    })
    return () => o.detach()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, orbit])

  if (failed) return <KFlat design={design} t={t} selected={selected} onPick={onPick} />
  return (
    <canvas
      ref={canvas}
      className="lab-art__3d"
      data-ready={ready ? '' : undefined}
      data-orbit={orbit ? (onCam ? 'tool' : 'view') : undefined}
      tabIndex={orbit ? 0 : undefined}
      aria-label={orbit ? 'Drag to turn around K1N0. Arrow keys turn, plus and minus zoom, 0 resets the view.' : undefined}
      onKeyDown={orbit ? e => {
        const c = keyCam(view.current ?? latest.current.design.cam ?? CAM_DEFAULT, e.key)
        if (!c) return
        e.preventDefault()
        view.current = c
        draw()
        latest.current.onCam?.(c)
      } : undefined}
      onPointerDown={onPick && !orbit ? e => {
        const p = r.current?.pick(e.clientX, e.clientY)
        if (p) onPick(p)
      } : undefined}
    />
  )
}

// Thumbnail as an <img>. 3D thumbs are rendered client-side by one shared offscreen renderer
// (the server sends only a coloured tile, which keeps the HTML light).
export function KThumb({ design, alt, size = 240 }: { design: KDesign; alt?: string; size?: number }) {
  const flat = useMemo(() => (design.view === 'flat' ? svgDataUrl(renderSvg(design, { uid: 'th', size })) : ''), [design, size])
  const [src, setSrc] = useState('')
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (design.view !== '3d') return
    let alive = true
    const el = ref.current
    const go = () => import('@/lib/lab/k3d').then(m => m.renderThumb(design, size * 2)).then(u => { if (alive) setSrc(u) }).catch(() => {
      if (alive) setSrc(svgDataUrl(renderSvg(design, { uid: 'th', size })))
    })
    if (!el || typeof IntersectionObserver === 'undefined') { go(); return () => { alive = false } }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); go() } }, { rootMargin: '200px' })
    io.observe(el)
    return () => { alive = false; io.disconnect() }
  }, [design, size])
  const shown = flat || src
  return (
    <span ref={ref} className="lab-thumb" style={{ background: bgColour(design) }} data-loading={shown ? undefined : ''}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {shown && <img src={shown} width={size} height={size} alt={alt ?? design.name} decoding="async" />}
      {!shown && alt ? <span className="lab-sr">{alt}</span> : null}
    </span>
  )
}
