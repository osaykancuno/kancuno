'use client'
// K Editor, K1N0 mode: the design is exactly a K1N0. The black X and four head blocks stay black;
// the visitor picks the four colours from the 16 of the palette and the on-chain look (an effect
// per colour, the speed, the 3D view). The stage is the contract's own 3D piece, so what you see
// is what you mint, look included.
import { useMemo, useRef, useState } from 'react'
import { ORIGINAL_LOOK, type KDesign } from '@/lib/lab/design'
import {
  BG_FX, cleanName, isDefaultName, lookFromDesign, coloursFromDesign, dataHex, designFromColours, HEAD_FX, INK, K1N0, NAMES, SLOTS, SPEEDS, validColours, type Colours, type Look,
} from '@/lib/lab/onchain'
import { exportJson, exportPng } from '@/lib/lab/export'
import { parseDesignText } from '@/lib/lab/validate'
import { useLab } from '@/lib/lab/store'
import K1N0Piece from './K1N0Piece'
import { KThumb } from './KArt'
import { Range, Section, Seg } from './controls'
import { MintPanel } from './MintDialog'
import { Zt } from './Zt'

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const L = (fx: Look['fx'], speed = 1, yaw = 0, pitch = 74, zoom = 100): Look => ({ fx, speed, yaw, pitch, zoom })

/** Starting K1N0 (generic names: the Lab is about K1N0, not other communities) */
export const K1N0_PRESETS: { name: string; colours: Colours; look: Look }[] = [
  { name: 'Original K1N0', colours: [4, 2, 15, 15], look: ORIGINAL_LOOK },
  { name: 'Night', colours: [14, 13, 0, 6], look: L([3, 6, 1, 1], 1) },
  { name: 'Cream', colours: [4, 0, 9, 9], look: L([0, 0, 0, 0]) },
  { name: 'Magenta', colours: [13, 15, 4, 14], look: L([8, 2, 0, 0], 2) },
  { name: 'Garden', colours: [8, 4, 2, 2], look: L([4, 0, 4, 4], 0) },
  { name: 'Sunset', colours: [10, 4, 0, 11], look: L([1, 1, 0, 0]) },
  { name: 'Arcade', colours: [3, 2, 6, 15], look: L([5, 6, 6, 6], 2) },
  { name: 'Signal', colours: [9, 0, 4, 4], look: L([7, 7, 0, 0], 3) },
]

/** The closest valid colours: background never black, coloured blocks never the background */
export function fixColours(c: Colours): Colours {
  const out = [...c] as Colours
  if (out[0] === INK) out[0] = out.slice(1).includes(4) ? 0 : 4
  for (let i = 1; i < 4; i++) if (out[i] === out[0]) out[i] = out[0] === INK ? 4 : INK
  return out
}

const randomK1N0 = (): { colours: Colours; look: Look } => {
  for (;;) {
    const c: Colours = [rnd(0, 15), rnd(0, 15), rnd(0, 15), rnd(0, 15)]
    if (c[0] === 11 || c[0] === 14) continue // dark backgrounds swallow the black X
    if (validColours(c)) {
      return {
        colours: c,
        look: L([rnd(0, 8), ...[0, 0, 0].map(() => (Math.random() < 0.3 ? 0 : rnd(1, 8)))] as Look['fx'], rnd(0, 3), rnd(-30, 30) * 2, rnd(52, 84), rnd(88, 120)),
      }
    }
  }
}

export default function K1N0Studio({ onFree }: { onFree: () => void }) {
  const { design: d, set, undo, redo, canUndo, canRedo, reset } = useLab()
  // the view follows the camera (another tool may have turned it), the effects come from the look
  const look = useMemo(() => (d.look ? lookFromDesign(d) : ORIGINAL_LOOK), [d])
  const colours = useMemo(() => coloursFromDesign(d).colours, [d])
  const title = cleanName(isDefaultName(d.name) ? '' : d.name)
  const data = useMemo(() => dataHex(colours, look, 1, title), [colours, look, title])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const file = useRef<HTMLInputElement>(null)

  const apply = (c: Colours, l: Look, name = d.name, key?: string) => set(x => designFromColours(c, x, l, name), key)
  const setSlot = (slot: number, v: number) => {
    const c = [...colours] as Colours
    c[slot] = v
    apply(fixColours(c), look, d.name, `k1-colour-${slot}`)
  }
  const edit = (p: Partial<Look>, key?: string) => apply(colours, { ...look, ...p }, d.name, key)
  const setFx = (slot: number, v: number) => edit({ fx: look.fx.map((x, i) => (i === slot ? v : x)) as Look['fx'] })

  const run = async (label: string, fn: () => void | Promise<void>) => {
    setError('')
    setStatus(`${label}…`)
    try { await fn(); setStatus(`${label}: done.`) } catch (e) { setStatus(''); setError(e instanceof Error ? e.message : 'Export failed.') }
  }
  const onImport = async (f: File | undefined) => {
    setError('')
    if (!f) return
    if (f.size > 400_000) { setError('File too large for a K1N0 design.'); return }
    try { set(parseDesignText(await f.text())); setStatus(`Loaded “${f.name}”.`) } catch (e) { setError(e instanceof Error ? e.message : 'Could not read this file.') } finally { if (file.current) file.current.value = '' }
  }

  return (
    <div className="lab-tool">
      <div className="lab-tool__head">
        <span className="lab-label">T.01</span>
        <h1 className="lab-tool__title">K Editor</h1>
        <p className="lab-note"><Zt>K1N0 mode: four colours and a look. What you see is what you mint.</Zt></p>
      </div>

      <div className="lab-tool__stagewrap">
        <div className="lab-stage">
          <K1N0Piece data={data} label="Your K1N0 in 3D, exactly as the NFT shows it: drag to turn it" />
        </div>
        <div className="lab-bar">
          <button type="button" className="lab-btn lab-btn--sm" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">Undo</button>
          <button type="button" className="lab-btn lab-btn--sm" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">Redo</button>
          <button type="button" className="lab-btn lab-btn--sm" onClick={() => { const r = randomK1N0(); apply(r.colours, r.look, 'Untitled') }} title="Random colours and look, always mintable">Remix</button>
          <button type="button" className="lab-btn lab-btn--sm" onClick={() => edit({ yaw: 0, pitch: 74, zoom: 100 })}>Front view</button>
          <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={reset}>Reset</button>
        </div>
        <p className="lab-note" style={{ textAlign: 'center' }}>The contract’s own 3D piece. Drag to look around; the minted view is set in Look.</p>
      </div>

      <div className="lab-controls">
        <Section title="Mode">
          <Seg label="Mode" value="k1n0" options={[{ value: 'k1n0', label: 'K1N0 · mintable' }, { value: 'free', label: 'Free remix' }]} onChange={v => { if (v === 'free') onFree() }} />
          <p className="lab-note"><Zt>The X and four blocks of the head are always black on a K1N0. Free remix unlocks everything (CC0, not mintable).</Zt></p>
        </Section>

        <Section title="Colours">
          <p className="lab-note">Four colours from the 16 of the palette. They are fixed forever at mint, and each combination can be minted once.</p>
          {SLOTS.map((name, slot) => (
            <div key={name} className="k1s-slot" role="radiogroup" aria-label={`${name} colour`}>
              <span className="lab-label">{name}</span>
              <div className="k1s-swatches">
                {K1N0.map((hex, i) => {
                  const off = slot === 0 ? i === INK : i === colours[0]
                  return (
                    <button key={hex} type="button" role="radio" aria-checked={colours[slot] === i} aria-label={`${name}: ${NAMES[i]}`} title={off ? `${NAMES[i]}: not allowed here` : NAMES[i]}
                      className="k1-sw" style={{ background: hex }} disabled={off} onClick={() => setSlot(slot, i)} />
                  )
                })}
              </div>
            </div>
          ))}
        </Section>

        <Section title="Look">
          <p className="lab-note">An effect for each colour, the speed and the 3D view. It is the first look of your K1N0; after the mint you can change it on-chain whenever you like.</p>
          <div className="tv-fx">
            {SLOTS.map((name, slot) => (
              <label key={name} className="tv-fx__row">
                <span><i style={{ background: K1N0[colours[slot]] }} />{name}</span>
                <select value={look.fx[slot]} onChange={e => setFx(slot, Number(e.target.value))}>
                  {(slot === 0 ? BG_FX : HEAD_FX).map((n, i) => <option key={n} value={i}>{n}</option>)}
                </select>
              </label>
            ))}
          </div>
          <Seg label="Speed" value={String(look.speed)} options={SPEEDS.map((n, i) => ({ value: String(i), label: n }))} onChange={v => edit({ speed: Number(v) })} />
          <Range label="Turn" min={-180} max={178} step={2} value={look.yaw} format={v => `${v}°`} onChange={v => edit({ yaw: v }, 'k1-yaw')} />
          <Range label="Height" min={20} max={89} step={1} value={look.pitch} format={v => `${v}°`} onChange={v => edit({ pitch: v }, 'k1-pitch')} />
          <Range label="Zoom" min={60} max={190} step={1} value={look.zoom} format={v => `${v}%`} onChange={v => edit({ zoom: v }, 'k1-zoom')} />
        </Section>

        <Section title="Presets">
          <div className="lab-presets">
            {K1N0_PRESETS.map(p => (
              <button key={p.name} type="button" className="lab-preset" onClick={() => apply(p.colours, { ...p.look, fx: [...p.look.fx] as Look['fx'] }, p.name)} aria-label={`Load preset ${p.name}`}>
                <KThumb design={designFromColours(p.colours, d, p.look, p.name)} alt="" size={160} />
                <span><Zt>{p.name}</Zt></span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Save & mint">
          <div className="lab-row">
            <label className="lab-label" htmlFor="k1-title">Title</label>
            <input id="k1-title" className="lab-input" style={{ flex: 1, width: 'auto' }} type="text" maxLength={32} value={isDefaultName(d.name) ? '' : d.name}
              placeholder="Optional, stays on-chain" onChange={e => set(x => ({ ...x, name: e.target.value }), 'name')} />
          </div>
          <p className="lab-note">Letters, digits, spaces and - _ . &apos; ! # (32 at most). It is written on-chain with the K1N0 and never changes.</p>
          <div className="lab-row">
            <button type="button" className="lab-btn" onClick={() => run('PNG', () => exportPng(d, 2048))} title="A still image of the four colours (the effects play on-chain)">PNG</button>
            <button type="button" className="lab-btn" onClick={() => run('JSON', () => exportJson(d))} title="Reload it later or share it">JSON</button>
            <button type="button" className="lab-btn lab-btn--ghost" onClick={() => file.current?.click()}>Import JSON</button>
            <input ref={file} type="file" accept=".json,application/json" hidden onChange={e => onImport(e.target.files?.[0])} />
          </div>
          <p className="lab-status" aria-live="polite">{status}</p>
          {error && <p className="lab-error" role="alert">{error}</p>}
          <MintPanel />
        </Section>
      </div>
    </div>
  )
}

/** Free remix → K1N0 mode: the same colours as the mint would take them, the view as its first look */
export function toK1N0(d: KDesign, look: Look): KDesign {
  return designFromColours(fixColours(coloursFromDesign(d).colours), d, look, d.name)
}
