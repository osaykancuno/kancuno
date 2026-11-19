'use client'
// T.06 Image Wrap: choose a picture and wear it on the 3D K. The file stays in this browser
// (decoded, scaled to 1024 px and kept in the design), so every tool and export sees it.
import { useEffect, useRef, useState } from 'react'
import { useLab } from '@/lib/lab/store'
import { canvasToBlob, downloadBlob, exportGlb, exportJson, renderFrame, slug } from '@/lib/lab/export'
import { composeImage, IMAGE_ACCEPT, IMAGE_DEFAULT, importImage, loadImage, type KImage } from '@/lib/lab/image'
import { BAR_POLYS, BODY_BOX3D, FIG_BOX3D, HEAD_BOX3D, HEAD_POLYS, type Box, type Pt } from '@/lib/lab/layout3d'
import { CAM_DEFAULT, isDefaultCam } from '@/lib/lab/orbit'
import type { KDesign } from '@/lib/lab/design'
import { KPreview } from './KArt'
import { Range, Section, Seg } from './controls'
import { MintPanel } from './MintDialog'

const TARGETS = [
  { value: 'head', label: 'Head' },
  { value: 'all', label: 'Whole figure' },
  { value: 'body', label: 'The X' },
] as const
const MODES = [
  { value: 'print', label: 'Print' },
  { value: 'tile', label: 'Every block' },
] as const
const FITS = [
  { value: 'cover', label: 'Fill' },
  { value: 'contain', label: 'Fit' },
] as const
const PALETTES = [
  { value: 'off', label: 'Original' },
  { value: 'brand', label: 'Lab colours' },
  { value: 'duo', label: 'Duotone' },
] as const

const regionOf = (o: KImage): Box => (o.target === 'head' ? HEAD_BOX3D : o.target === 'body' ? BODY_BOX3D : FIG_BOX3D)

export default function ImageWrap() {
  const { design: d, set, undo, redo, canUndo, canRedo } = useLab()
  const img = d.img
  const file = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)

  const patch = (o: Partial<KImage>, key?: string) =>
    set(x => (x.img ? { ...x, img: { ...x.img, ...o } } : x), key)

  const take = async (blob: Blob | null | undefined, name = 'image') => {
    if (!blob) return
    setError('')
    setBusy(true)
    setStatus(`Reading ${name}…`)
    try {
      const { src, w, h } = await importImage(blob)
      await loadImage(src)
      // the picture needs the clay figure: vector form, 3D view
      set(x => ({ ...x, form: 'vector', view: '3d', img: { ...IMAGE_DEFAULT, ...(x.img ? keepPlacement(x.img) : {}), src, w, h } }))
      setStatus(`Image on K1N0: ${w} × ${h} px, kept in this browser only.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'This image could not be used.')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  // Paste an image from the clipboard anywhere on the page
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      const item = [...(e.clipboardData?.items ?? [])].find(i => i.kind === 'file' && i.type.startsWith('image/'))
      if (!item) return
      e.preventDefault()
      take(item.getAsFile(), 'the pasted image')
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const guard = async (label: string, run: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    setError('')
    setStatus(`${label}…`)
    try { await run() } catch (e) { setError(e instanceof Error ? e.message : 'Export failed.'); setStatus('') } finally { setBusy(false) }
  }

  const pictured: KDesign = d.view === '3d' && d.form === 'vector' ? d : { ...d, view: '3d', form: 'vector' }

  return (
    <div className="lab-tool">
      <header className="lab-tool__head">
        <span className="lab-label">T.06</span>
        <h1 className="lab-tool__title">Image Wrap</h1>
        <p className="lab-note">Your picture, worn by K1N0.</p>
      </header>

      <div className="lab-tool__stagewrap">
        <div
          className="lab-stage iw-stage"
          data-over={over || undefined}
          onDragOver={e => { if ([...e.dataTransfer.items].some(i => i.kind === 'file')) { e.preventDefault(); setOver(true) } }}
          onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0], e.dataTransfer.files[0]?.name) }}
        >
          <KPreview design={pictured} uid="iw" animate onCam={c => set(x => ({ ...x, cam: c }), 'cam')} label={img ? `${d.name} wearing your image` : `${d.name}: add an image`} />
          {over && <div className="iw-drop" aria-hidden="true">Drop to wrap K1N0</div>}
        </div>
        <div className="lab-bar">
          <button type="button" className="lab-btn lab-btn--sm lab-btn--primary" onClick={() => file.current?.click()} aria-disabled={busy || undefined}>
            {img ? 'Replace image' : 'Choose image'}
          </button>
          <button type="button" className="lab-btn lab-btn--sm" onClick={undo} disabled={!canUndo}>Undo</button>
          <button type="button" className="lab-btn lab-btn--sm" onClick={redo} disabled={!canRedo}>Redo</button>
          {!isDefaultCam(d.cam) && (
            <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => set(x => ({ ...x, cam: { ...CAM_DEFAULT } }))}>Front view</button>
          )}
        </div>
        <p className="lab-note" style={{ textAlign: 'center' }}>
          Drop, paste or choose an image. Drag the K to turn it, scroll to zoom.
        </p>
        <input
          ref={file}
          type="file"
          accept={IMAGE_ACCEPT}
          hidden
          onChange={e => { take(e.target.files?.[0], e.target.files?.[0]?.name); e.target.value = '' }}
        />
      </div>

      <div className="lab-controls">
        {!img ? (
          <Section title="Image">
            <button type="button" className="iw-pick" onClick={() => file.current?.click()} disabled={busy}>
              <span className="iw-pick__big">+</span>
              <span>Choose an image</span>
              <span className="lab-note">PNG, JPG, WebP, GIF or AVIF. Or drop it on K1N0, or paste it (Ctrl+V).</span>
            </button>
            <p className="lab-note">The image stays in this browser: nothing is uploaded. Use pictures you own or may use.</p>
            <p className="lab-status" role="status">{status}</p>
            {error && <p className="lab-error" role="alert">{error}</p>}
          </Section>
        ) : (
          <>
            <Section title="Placement" aside={<button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => set(x => ({ ...x, img: null }))}>Remove</button>}>
              <Framing img={img} onPan={(x, y) => patch({ x, y }, 'img-pan')} onZoom={zoom => patch({ zoom }, 'img-zoom')} />
              <Seg label="On" value={img.target} options={TARGETS} onChange={target => patch({ target })} />
              <Seg label="Mapping" value={img.mode} options={MODES} onChange={mode => patch({ mode })} />
              <Seg label="Frame" value={img.fit} options={FITS} onChange={fit => patch({ fit })} />
              <Range label="Zoom" min={0.3} max={5} step={0.01} value={img.zoom} format={v => `${v.toFixed(2)}×`} onChange={zoom => patch({ zoom }, 'img-zoom')} />
              <Range label="Move ←→" min={-1.5} max={1.5} step={0.01} value={img.x} format={v => v.toFixed(2)} onChange={x => patch({ x }, 'img-x')} />
              <Range label="Move ↑↓" min={-1.5} max={1.5} step={0.01} value={img.y} format={v => v.toFixed(2)} onChange={y => patch({ y }, 'img-y')} />
              <Range label="Rotate" min={-180} max={180} step={1} value={img.rot} format={v => `${Math.round(v)}°`} onChange={rot => patch({ rot }, 'img-rot')} />
              <div className="lab-row">
                <button type="button" className="lab-btn lab-btn--sm" onClick={() => patch({ rot: (((img.rot + 90 + 180) % 360) + 360) % 360 - 180 })}>Rotate 90°</button>
                <button type="button" className="lab-btn lab-btn--sm" onClick={() => patch({ x: 0, y: 0, zoom: 1, rot: 0 })}>Centre</button>
              </div>
              <p className="lab-note">
                {img.mode === 'print'
                  ? 'Print lays one picture across K1N0 seen from above, like a decal. Drag the frame above to place it.'
                  : 'Every block wears the whole picture on each face.'}
              </p>
            </Section>

            <Section title="Colour">
              <Seg label="Palette" value={img.palette} options={PALETTES} onChange={palette => patch({ palette })} />
              <Range label="Brightness" min={-1} max={1} step={0.01} value={img.bright} format={v => `${Math.round(v * 100)}`} onChange={bright => patch({ bright }, 'img-b')} />
              <Range label="Contrast" min={-1} max={1} step={0.01} value={img.contrast} format={v => `${Math.round(v * 100)}`} onChange={contrast => patch({ contrast }, 'img-c')} />
              <Range label="Saturation" min={0} max={2} step={0.01} value={img.sat} format={v => `${Math.round(v * 100)}%`} onChange={sat => patch({ sat }, 'img-s')} />
              <p className="lab-note">Lab colours maps the picture to five K1N0 colours: ink, yellow, pink, purple and cream. Duotone uses the X colour and the centre square.</p>
            </Section>

            <Section title="Export">
              <div className="lab-row">
                <button type="button" className="lab-btn lab-btn--primary" aria-disabled={busy || undefined} onClick={() => guard('Rendering PNG', async () => {
                  const c = await renderFrame(pictured, 0, 2048)
                  downloadBlob(await canvasToBlob(c), `${slug(d.name)}-image.png`)
                  setStatus('PNG saved, 2048 px.')
                })}>PNG 2048</button>
                <button type="button" className="lab-btn" aria-disabled={busy || undefined} onClick={() => guard('Building the 3D model', async () => {
                  await exportGlb(pictured)
                  setStatus('GLB saved, with the image as texture.')
                })}>GLB</button>
                <button type="button" className="lab-btn" onClick={() => exportJson(d)}>JSON</button>
              </div>
              <MintPanel note="The picture stays yours, off-chain" />
              <p className="lab-note">The design JSON carries the picture, so it opens the same in any tool. The flat SVG keeps the colours of the figure.</p>
              <p className="lab-status" role="status">{status}</p>
              {error && <p className="lab-error" role="alert">{error}</p>}
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

// A new picture keeps where the last one sat on the K (target, mapping), not its framing
function keepPlacement(o: KImage): Partial<KImage> {
  return { target: o.target, mode: o.mode, palette: o.palette }
}

// The print region seen from above, with the K's blocks outlined: drag to move, wheel to zoom
function Framing({ img, onPan, onZoom }: { img: KImage; onPan: (x: number, y: number) => void; onZoom: (z: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const latest = useRef(img)
  latest.current = img
  const box = img.mode === 'print' ? regionOf(img) : { x: 0, y: 0, w: 1, h: 1 }
  const W = 360
  const H = Math.round((W * box.h) / box.w)

  useEffect(() => {
    let alive = true
    const c = ref.current
    if (!c) return
    loadImage(img.src).then(pic => {
      if (!alive) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = W * dpr
      c.height = H * dpr
      const g = c.getContext('2d')!
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.drawImage(composeImage(pic, img, W, H, '#17140f'), 0, 0, W, H)
      if (img.mode !== 'print') return
      // a veil over what falls outside the K, the blocks that wear the picture outlined
      const map = (p: Pt): Pt => [((p[0] - box.x) / box.w) * W, ((p[1] - box.y) / box.h) * H]
      const polys = [...(img.target !== 'body' ? HEAD_POLYS : []), ...(img.target !== 'head' ? BAR_POLYS : [])]
      const blocks = new Path2D()
      for (const poly of polys) {
        poly.map(map).forEach(([x, y], i) => (i ? blocks.lineTo(x, y) : blocks.moveTo(x, y)))
        blocks.closePath()
      }
      const veil = document.createElement('canvas')
      veil.width = c.width
      veil.height = c.height
      const v = veil.getContext('2d')!
      v.setTransform(dpr, 0, 0, dpr, 0, 0)
      v.fillStyle = 'rgba(15, 13, 10, 0.72)'
      v.fillRect(0, 0, W, H)
      v.globalCompositeOperation = 'destination-out' // the blocks (their union) stay clear
      v.fill(blocks)
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.drawImage(veil, 0, 0)
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.strokeStyle = '#fbc500'
      g.lineWidth = 1.5
      g.stroke(blocks)
    }, () => undefined)
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, W, H])

  // wheel zoom needs a non-passive listener, or the page scrolls too
  const zoomRef = useRef(onZoom)
  zoomRef.current = onZoom
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomRef.current(Math.max(0.3, Math.min(5, Math.round(latest.current.zoom * Math.exp(-e.deltaY * 0.0012) * 100) / 100)))
    }
    c.addEventListener('wheel', wheel, { passive: false })
    return () => c.removeEventListener('wheel', wheel)
  }, [])

  return (
    <canvas
      ref={ref}
      className="iw-frame"
      style={{ aspectRatio: `${W} / ${H}` }}
      role="img"
      aria-label="Where the picture sits on K1N0, seen from above. Drag to move it, scroll to zoom."
      onPointerDown={e => {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { x: e.clientX, y: e.clientY, ox: latest.current.x, oy: latest.current.y }
      }}
      onPointerMove={e => {
        const s = drag.current
        if (!s) return
        const r = e.currentTarget.getBoundingClientRect()
        const clamp = (v: number) => Math.max(-1.5, Math.min(1.5, Math.round(v * 100) / 100))
        onPan(clamp(s.ox + ((e.clientX - s.x) / r.width) * 2), clamp(s.oy + ((e.clientY - s.y) / r.height) * 2))
      }}
      onPointerUp={() => { drag.current = null }}
      onPointerCancel={() => { drag.current = null }}
    />
  )
}
