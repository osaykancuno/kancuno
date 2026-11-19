'use client'
import { useEffect, useRef, useState } from 'react'
import { ANIM_LOOPS, type AnimLoop } from '@/lib/lab/design'
import { useLab } from '@/lib/lab/store'
import { canvasToBlob, downloadBlob, exportJson, renderFrame, slug } from '@/lib/lab/export'
import { KPreview, useReducedMotion } from './KArt'
import { CAM_DEFAULT, isDefaultCam } from '@/lib/lab/orbit'
import { MintPanel } from './MintDialog'

const LABELS: Record<AnimLoop, string> = {
  pulse: 'Pulse glow', bounce: 'Bounce', float: 'Float', wave: 'Head wave', blink: 'Blink',
  spin: 'Turn', rain: 'Pixel rain', glitch: 'Glitch', scan: 'Scan line',
}
const RECIPES: { label: string; loops: AnimLoop[] }[] = [
  { label: 'Neon pulse', loops: ['pulse'] },
  { label: 'Pixel rain', loops: ['rain', 'bounce'] },
  { label: 'Cyber', loops: ['glitch', 'scan'] },
  { label: 'Calm', loops: ['float', 'spin'] },
]

export function AnimationBench() {
  const { design, set } = useLab()
  const { loops, period } = design.anim
  const reduced = useReducedMotion()
  const [playing, setPlaying] = useState(!reduced)
  const [pos, setPos] = useState(0) // 0..1 within one loop, used while paused
  const [gifSize, setGifSize] = useState(480)
  const [fps, setFps] = useState(24)
  const [busy, setBusy] = useState<null | 'gif' | 'video' | 'png'>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [canVideo, setCanVideo] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const lastAnnounced = useRef(-1)

  useEffect(() => () => abort.current?.abort(), [])
  // Follow live reduced-motion changes: turning it on pauses; playing again stays the user's choice
  useEffect(() => { if (reduced) setPlaying(false) }, [reduced])

  useEffect(() => {
    setCanVideo(typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function' && ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].some(m => MediaRecorder.isTypeSupported(m)))
  }, [])

  const t = pos * period
  const showLive = playing && loops.length > 0

  const toggleLoop = (l: AnimLoop) =>
    set(d => ({ ...d, anim: { ...d.anim, loops: d.anim.loops.includes(l) ? d.anim.loops.filter(x => x !== l) : ANIM_LOOPS.filter(x => x === l || d.anim.loops.includes(x)) } }))
  const setRecipe = (ls: AnimLoop[]) => set(d => ({ ...d, anim: { ...d.anim, loops: ls } }))

  // Visual bar updates every frame; the announced status only every 25%
  const announce = (p: number, text: (pct: number) => string) => {
    setProgress(p)
    const step = Math.floor(p * 4)
    if (step !== lastAnnounced.current) { lastAnnounced.current = step; setStatus(text(step * 25)) }
  }

  const guard = async (kind: 'gif' | 'video' | 'png', label: string, run: (ac: AbortController) => Promise<void>) => {
    if (busy) return
    const ac = new AbortController()
    abort.current = ac
    lastAnnounced.current = -1
    setBusy(kind); setProgress(0); setStatus(`${label}…`)
    setTimeout(() => cancelRef.current?.focus(), 0)
    try {
      await run(ac)
    } catch (e) {
      setStatus(e instanceof Error && e.name === 'AbortError' ? 'Cancelled.' : e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setBusy(null); abort.current = null
    }
  }

  const exportGif = () => guard('gif', 'Rendering GIF', async ac => {
    const { encodeGif } = await import('@/lib/lab/gif')
    const frames = Math.max(2, Math.min(200, Math.round(period * fps)))
    const eff = frames / period
    const canvas = document.createElement('canvas')
    const bytes = await encodeGif({
      width: gifSize, height: gifSize, frames, fps: eff, signal: ac.signal,
      onProgress: p => announce(p, pct => `Encoding GIF… ${pct}%`),
      getFrame: async i => {
        await renderFrame(design, i / eff, gifSize, canvas)
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) throw new Error('Canvas is not available in this browser.')
        ctx.globalCompositeOperation = 'destination-over'
        ctx.fillStyle = '#0d0b08'
        ctx.fillRect(0, 0, gifSize, gifSize)
        ctx.globalCompositeOperation = 'source-over'
        return ctx.getImageData(0, 0, gifSize, gifSize).data
      },
    })
    const blob = new Blob([bytes as BlobPart], { type: 'image/gif' })
    downloadBlob(blob, `${slug(design.name)}.gif`)
    setStatus(`GIF saved: ${frames} frames, ${(blob.size / 1024).toFixed(0)} KB.`)
  })

  const exportVid = () => guard('video', 'Preparing video', async ac => {
    const { exportVideo } = await import('@/lib/lab/video')
    const { blob, ext } = await exportVideo(design, {
      signal: ac.signal,
      onProgress: p => announce(p, pct => `${p < 0.5 ? 'Preparing' : 'Recording'} video… ${pct}%`),
    })
    downloadBlob(blob, `${slug(design.name)}.${ext}`)
    setStatus(`Video saved: 2 loops, ${(blob.size / 1024).toFixed(0)} KB.`)
  })

  const exportStill = () => guard('png', 'Rendering PNG', async () => {
    const c = await renderFrame(design, t, 1024)
    downloadBlob(await canvasToBlob(c), `${slug(design.name)}.png`)
    setStatus('PNG saved.')
  })

  return (
    <div className="lab-tool">
      <header className="lab-tool__head">
        <span className="lab-soon">T.03</span>
        <h1 className="lab-tool__title">Animation Bench</h1>
        <p className="lab-note">Make K1N0 move. Export a loop.</p>
      </header>

      <div className="lab-tool__stagewrap">
        <div className="lab-stage">
          {/* one preview (one WebGL context): live while playing, the scrubbed frame when paused */}
          <KPreview
            design={design}
            uid="ab"
            animate
            forceMotion={showLive}
            onCam={c => set(d => ({ ...d, cam: c }), 'cam')}
            time={showLive ? undefined : t}
            label={showLive ? `${design.name}, animated` : `${design.name}, paused at ${t.toFixed(2)} seconds`}
          />
        </div>
        <div className="lab-bar">
          <button type="button" className="lab-btn lab-btn--sm" onClick={() => setPlaying(p => !p)} disabled={loops.length === 0}>
            {showLive ? 'Pause' : 'Play'}
          </button>
          {design.view === '3d' && !isDefaultCam(design.cam) && (
            <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => set(d => ({ ...d, cam: { ...CAM_DEFAULT } }))}>Front view</button>
          )}
        </div>
        <div className="ab-scrub">
          <input
            type="range" min={0} max={1} step={0.01} value={pos} aria-label="Scrub through one loop" aria-valuetext={`${t.toFixed(2)} seconds`}
            onChange={e => { setPlaying(false); setPos(Number(e.target.value)) }}
          />
          <output>{t.toFixed(2)}s</output>
        </div>
        {reduced && <p className="lab-note">Your system asks for reduced motion, so playback starts paused. Press Play to opt in, or use the scrubber. Export still works.</p>}
        {loops.length === 0 && <p className="lab-note">Pick at least one loop to bring K1N0 to life.</p>}
      </div>

      <div className="lab-controls">
        <section className="lab-panel lab-section" aria-label="Loops">
          <h2 className="lab-section__title">Loops</h2>
          <div className="ab-loops">
            {ANIM_LOOPS.map(l => (
              <button key={l} type="button" className="ab-loop" aria-pressed={loops.includes(l)} onClick={() => toggleLoop(l)}>
                {LABELS[l]}
              </button>
            ))}
          </div>
          <div className="lab-label">Recipes</div>
          <div className="ab-recipes">
            {RECIPES.map(r => (
              <button key={r.label} type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => setRecipe(r.loops)}>{r.label}</button>
            ))}
            <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => setRecipe([])}>None</button>
          </div>
          <label className="lab-range">
            <span className="lab-label">Period</span>
            <input
              type="range" min={0.6} max={8} step={0.1} value={period}
              onChange={e => { const v = Number(e.target.value); set(d => ({ ...d, anim: { ...d.anim, period: v } }), 'period') }}
            />
            <output>{period.toFixed(1)}s</output>
          </label>
        </section>

        <section className="lab-panel lab-section" aria-label="Export">
          <h2 className="lab-section__title">Export</h2>
          <div className="lab-row">
            <span className="lab-label">GIF size</span>
            <div className="lab-seg">
              {[480, 720].map(s => <button key={s} type="button" aria-pressed={gifSize === s} onClick={() => setGifSize(s)}>{s}px</button>)}
            </div>
            <div className="lab-seg">
              {[20, 24].map(f => <button key={f} type="button" aria-pressed={fps === f} onClick={() => setFps(f)}>{f} fps</button>)}
            </div>
          </div>
          <div className="ab-export">
            <button type="button" className="lab-btn lab-btn--primary" aria-disabled={!!busy} onClick={() => { if (!busy) exportGif() }}>GIF</button>
            {canVideo && <button type="button" className="lab-btn" aria-disabled={!!busy} onClick={() => { if (!busy) exportVid() }}>Video</button>}
            <button type="button" className="lab-btn" aria-disabled={!!busy} onClick={() => { if (!busy) exportStill() }}>PNG still</button>
            <button type="button" className="lab-btn" aria-disabled={!!busy} onClick={() => { if (busy) return; exportJson(design); setStatus('JSON saved.') }}>JSON</button>
            {busy && busy !== 'png' && <button type="button" ref={cancelRef} className="lab-btn lab-btn--ghost" onClick={() => abort.current?.abort()}>Cancel</button>}
          </div>
          {busy && busy !== 'png' && <div className="ab-progress" role="progressbar" aria-label={busy === 'gif' ? 'GIF export' : 'Video export'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>}
          <p className="lab-status" role="status">{status}</p>
          <p className="lab-note">GIF and video are one seamless loop; video plays it twice. The PNG uses the scrubber position.</p>
          <MintPanel />
        </section>
      </div>
    </div>
  )
}
