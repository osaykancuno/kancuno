'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { HEAD } from '@/lib/lab/base'
import { cloneDesign, PRESETS, remix, type Fill, type KDesign, type PartId } from '@/lib/lab/design'
import { exportGlb, exportJson, exportPng, exportSvg } from '@/lib/lab/export'
import { parseDesignText } from '@/lib/lab/validate'
import { CAM_DEFAULT, isDefaultCam } from '@/lib/lab/orbit'
import { useLab } from '@/lib/lab/store'
import { KPreview, KThumb } from './KArt'
import { ColorPick, FillEditor, Range, Section, Seg } from './controls'
import { MintButton } from './MintDialog'

const PARTS: { id: PartId; name: string; hint: string }[] = [
  { id: 'bg', name: 'Background', hint: 'The field behind the K' },
  { id: 'body', name: 'Body', hint: 'The X' },
  { id: 'head', name: 'Head', hint: 'Seven squares' },
]

const chip = (f: Fill) =>
  f.kind === 'solid' ? f.a : f.kind === 'gradient' ? `linear-gradient(135deg, ${f.a}, ${f.b})` : `repeating-linear-gradient(45deg, ${f.a} 0 4px, ${f.b} 4px 8px)`

export default function KEditor() {
  const { design: d, set, undo, redo, canUndo, canRedo, reset } = useLab()
  const [part, setPart] = useState<PartId>('head')
  const [cube, setCube] = useState(3)
  const [pngSize, setPngSize] = useState(2048)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const pixel = d.form === 'pixel'

  const patch = (fn: (x: KDesign) => void, key?: string) => set(x => { fn(x); return x }, key)

  const pick = (p: PartId | 'pixels') => {
    if (p === 'pixels') return
    setPart(p)
  }

  const onImport = async (f: File | undefined) => {
    setError('')
    if (!f) return
    if (f.size > 400_000) { setError('File too large for a K design.'); return }
    try {
      set(parseDesignText(await f.text()))
      setStatus(`Loaded “${f.name}”.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.')
    } finally {
      if (file.current) file.current.value = ''
    }
  }

  const run = async (label: string, fn: () => void | Promise<void>) => {
    setError('')
    setStatus(`${label}…`)
    try {
      await fn()
      setStatus(`${label}: done.`)
    } catch (e) {
      setStatus('')
      setError(e instanceof Error ? e.message : 'Export failed.')
    }
  }

  const visibleFor = (id: PartId) => d[id].visible
  const fillFor = (id: PartId): Fill => (id === 'head' && !d.head.useFill ? { kind: 'solid', a: d.head.cubes[3] } : d[id].fill)

  return (
    <div className="lab-tool">
      <div className="lab-tool__head">
        <span className="lab-label">T.01</span>
        <h1 className="lab-tool__title">K Editor</h1>
        <p className="lab-note">Pick a part. Change everything but the K.</p>
      </div>

      <div className="lab-tool__stagewrap">
        <div className="lab-stage">
          <KPreview design={d} uid="ke" selected={pixel ? null : part} onPick={pick} animate onCam={c => set(x => ({ ...x, cam: c }), 'cam')} />
        </div>
        <div className="lab-bar">
          <div className="lab-seg" role="group" aria-label="View">
            <button type="button" aria-pressed={d.view === '3d'} onClick={() => patch(x => { x.view = '3d' })}>3D</button>
            <button type="button" aria-pressed={d.view === 'flat'} onClick={() => patch(x => { x.view = 'flat' })}>Flat</button>
          </div>
          <button type="button" className="lab-btn lab-btn--sm" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">Undo</button>
          <button type="button" className="lab-btn lab-btn--sm" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">Redo</button>
          <button type="button" className="lab-btn lab-btn--sm" onClick={() => set(remix(d))} title="A random variation that keeps the K">Remix</button>
          {d.view === '3d' && !isDefaultCam(d.cam) && (
            <button type="button" className="lab-btn lab-btn--sm" onClick={() => set(x => ({ ...x, cam: { ...CAM_DEFAULT } }))} title="Back to the front view (double-click the stage)">Front view</button>
          )}
          <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={reset}>Reset</button>
        </div>
        <p className="lab-note" style={{ textAlign: 'center' }}>
          {d.view === '3d' ? 'Click a part, or choose it in Layers. Drag to turn the K, scroll or pinch to zoom.' : 'Click a part of the K, or choose it in Layers.'}
        </p>
      </div>

      <div className="lab-controls">
        <Section title="Layers">
          <div className="lab-layers">
            {[...PARTS].reverse().map(p => {
              const disabled = pixel && (p.id === 'body' || p.id === 'head')
              return (
                <div key={p.id} className="lab-layer" data-active={part === p.id && !disabled}>
                  <button type="button" className="lab-layer__pick" onClick={() => setPart(p.id)} disabled={disabled} aria-pressed={part === p.id}>
                    <span className="lab-layer__chip" style={{ background: chip(fillFor(p.id)) }} aria-hidden="true" />
                    <span>{p.name}</span>
                    <span className="lab-label" style={{ marginLeft: 'auto' }}>{disabled ? 'Pixel form' : p.hint}</span>
                  </button>
                  <button
                    type="button"
                    className="lab-layer__eye"
                    aria-pressed={visibleFor(p.id)}
                    aria-label={`Show ${p.name}`}
                    onClick={() => patch(x => { x[p.id].visible = !x[p.id].visible })}
                    disabled={disabled}
                  >
                    Show
                  </button>
                </div>
              )
            })}
          </div>
          {pixel && (
            <p className="lab-note">
              This K is in <strong>pixel form</strong>. Paint it in <Link href="/klab/pixel">Pixel Forge</Link>, or{' '}
              <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => patch(x => { x.form = 'vector' })}>switch to vector</button>
            </p>
          )}
        </Section>

        <Section title={PARTS.find(p => p.id === part)!.name}>
          {part === 'bg' && (
            <FillEditor k="bg" fill={d.bg.fill} onChange={(f, key) => patch(x => { x.bg.fill = f; x.bg.visible = true }, key)} />
          )}

          {part === 'body' && !pixel && (
            <>
              <Seg label="Style" value={d.body.line ? 'line' : 'solid'} options={[{ value: 'solid', label: 'Solid' }, { value: 'line', label: 'Line' }]}
                onChange={v => patch(x => { x.body.line = v === 'line' })} />
              <FillEditor k="bd" fill={d.body.fill} onChange={(f, key) => patch(x => { x.body.fill = f; x.body.visible = true }, key)} />
            </>
          )}

          {part === 'head' && !pixel && (
            <>
              <Seg label="Style" value={d.head.line ? 'line' : 'solid'} options={[{ value: 'solid', label: 'Solid' }, { value: 'line', label: 'Line' }]}
                onChange={v => patch(x => { x.head.line = v === 'line' })} />
              <Seg label="Colour" value={d.head.useFill ? 'fill' : 'cubes'} options={[{ value: 'cubes', label: 'Per square' }, { value: 'fill', label: 'One fill' }]}
                onChange={v => patch(x => { x.head.useFill = v === 'fill' })} />
              {d.head.useFill ? (
                <FillEditor k="hd" fill={d.head.fill} onChange={(f, key) => patch(x => { x.head.fill = f; x.head.visible = true }, key)} />
              ) : (
                <>
                  <div className="lab-row" style={{ alignItems: 'flex-start' }}>
                    <span className="lab-label">Square</span>
                    <div className="lab-cubes" role="group" aria-label="Choose a head square">
                      {HEAD.map((h, i) => (
                        <button
                          key={i}
                          type="button"
                          className="lab-cube"
                          style={{ left: (h.x - 32.5) * 2.66, top: (h.y - 23) * 2.9, background: d.head.cubes[i] }}
                          aria-pressed={cube === i}
                          aria-label={`Square ${i + 1}, row ${h.row + 1}: ${d.head.cubes[i]}`}
                          onClick={() => setCube(i)}
                        />
                      ))}
                    </div>
                  </div>
                  <ColorPick label={`Square ${cube + 1}`} value={d.head.cubes[cube]} onChange={c => patch(x => { x.head.cubes[cube] = c; x.head.visible = true }, `cube-${cube}`)} />
                  <div className="lab-row">
                    <button type="button" className="lab-btn lab-btn--sm" onClick={() => patch(x => { const c = x.head.cubes[cube]; x.head.cubes = x.head.cubes.map((_, i) => (HEAD[i].row === HEAD[cube].row ? c : x.head.cubes[i])) })}>Apply to row</button>
                    <button type="button" className="lab-btn lab-btn--sm" onClick={() => patch(x => { x.head.cubes = x.head.cubes.map(() => x.head.cubes[cube]) })}>Apply to all</button>
                  </div>
                </>
              )}
            </>
          )}
        </Section>

        <Section title="Effects" aside={<button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => patch(x => { x.fx.seed = Math.floor(Math.random() * 1e6) })}>New seed</button>}>
          <Range label="Neon glow" min={0} max={1} value={d.fx.glow} onChange={v => patch(x => { x.fx.glow = v }, 'fx-glow')} />
          <Range label="Glitch" min={0} max={1} value={d.fx.glitch} onChange={v => patch(x => { x.fx.glitch = v }, 'fx-glitch')} />
          <Range label="Pixelate" min={0} max={1} value={d.fx.pixel} onChange={v => patch(x => { x.fx.pixel = v }, 'fx-pixel')} />
          <Range label="Grain" min={0} max={1} value={d.fx.grain} onChange={v => patch(x => { x.fx.grain = v }, 'fx-grain')} />
          <Range label="Scanlines" min={0} max={1} value={d.fx.scan} onChange={v => patch(x => { x.fx.scan = v }, 'fx-scan')} />
          <Range label="Depth" min={0} max={1} value={d.fx.depth} onChange={v => patch(x => { x.fx.depth = v }, 'fx-depth')} />
          <p className="lab-note">Motion lives in the <Link href="/klab/animate">Animation Bench</Link>.</p>
        </Section>

        <Section title="Presets">
          <div className="lab-presets">
            {PRESETS.map(p => (
              <button key={p.name} type="button" className="lab-preset" onClick={() => set(cloneDesign(p))} aria-label={`Load preset ${p.name}`}>
                <KThumb design={p} alt="" size={160} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Save & export">
          <div className="lab-row">
            <label className="lab-label" htmlFor="ke-name">Name</label>
            <input id="ke-name" className="lab-input" style={{ flex: 1, width: 'auto' }} type="text" maxLength={60} value={d.name}
              onChange={e => patch(x => { x.name = e.target.value }, 'name')} />
          </div>
          <div className="lab-row">
            <label className="lab-label" htmlFor="ke-png">PNG size</label>
            <select id="ke-png" className="lab-select" value={pngSize} onChange={e => setPngSize(Number(e.target.value))}>
              {[1024, 2048, 4096].map(s => <option key={s} value={s}>{s} px</option>)}
            </select>
          </div>
          <div className="lab-row">
            <button type="button" className="lab-btn lab-btn--primary" onClick={() => run('PNG', () => exportPng(d, pngSize))}>PNG</button>
            <button type="button" className="lab-btn" onClick={() => run('GLB', () => exportGlb(d))} title="The 3D model, for AR and 3D apps">GLB 3D</button>
            <button type="button" className="lab-btn" onClick={() => run('SVG', () => exportSvg(d))} title="The flat vector version">SVG flat</button>
            <button type="button" className="lab-btn" onClick={() => run('JSON', () => exportJson(d))} title="Reload it later or share it">JSON</button>
            <button type="button" className="lab-btn lab-btn--ghost" onClick={() => file.current?.click()}>Import JSON</button>
            <input ref={file} type="file" accept=".json,application/json" hidden onChange={e => onImport(e.target.files?.[0])} />
          </div>
          <p className="lab-status" aria-live="polite">{status}</p>
          {error && <p className="lab-error" role="alert">{error}</p>}
          <div className="lab-row" style={{ borderTop: '1px solid var(--lab-line)', paddingTop: 12 }}>
            <MintButton />
            <span className="lab-note">Optional · K1N0 on Ethereum, your colours alone</span>
          </div>
          <p className="lab-note">PNG and GIF follow the view (3D or flat). Your K is saved in this browser.</p>
        </Section>
      </div>
    </div>
  )
}
