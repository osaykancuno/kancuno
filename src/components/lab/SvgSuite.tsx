'use client'
import { useEffect, useMemo, useState } from 'react'
import { renderSvg, svgDataUrl } from '@/lib/lab/render'
import { useLab } from '@/lib/lab/store'
import { Zt } from './Zt'
import { downloadText, slug } from '@/lib/lab/export'
import { BASE_FILES, baseFile } from '@/lib/lab/base-files'
import { MAX_OPTIMIZE_BYTES, byteSize, looksLikeSvg, optimizeSvg, setSvgSize, type OptimizeOptions } from '@/lib/lab/svg-optimize'

const MAX_BYTES = 1024 * 1024
const SIZES: { label: string; value: number }[] = [
  { label: 'viewBox only', value: 0 }, { label: '512', value: 512 }, { label: '1024', value: 1024 }, { label: '2048', value: 2048 },
]

const fmt = (n: number) => (n >= 10240 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`)

export function SvgSuite() {
  const { design } = useLab()
  const [source, setSource] = useState<'design' | 'paste'>('design')
  const [pasted, setPasted] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [opts, setOpts] = useState<OptimizeOptions>({ stripMeta: true, collapse: true, round: true, decimals: 2, emptyGroups: true, editorAttrs: true })
  const [size, setSize] = useState(1024)

  const raw = useMemo(
    () => (source === 'design' ? renderSvg(design, { size: 1024, t: 0, uid: 'ss' }) : pasted),
    [source, design, pasted],
  )
  // Debounce so typing or pasting does not run the optimiser on every keystroke
  const [debounced, setDebounced] = useState(raw)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(raw), 250)
    return () => clearTimeout(id)
  }, [raw])
  const tooBig = byteSize(raw) > MAX_OPTIMIZE_BYTES
  const valid = !tooBig && looksLikeSvg(debounced)
  const result = useMemo(() => (valid ? setSvgSize(optimizeSvg(debounced, opts), size) : ''), [valid, debounced, opts, size])
  const before = valid ? byteSize(debounced) : 0
  const after = valid ? byteSize(result) : 0
  const saved = before > 0 ? Math.round((1 - after / before) * 100) : 0
  const src = useMemo(() => (result ? svgDataUrl(result) : ''), [result])
  const name = source === 'design' ? slug(design.name) : 'k-lab-svg'

  const flag = (k: keyof OptimizeOptions, label: string) => (
    <label className="lab-check">
      <input type="checkbox" checked={opts[k] as boolean} onChange={e => setOpts(o => ({ ...o, [k]: e.target.checked }))} />
      {label}
    </label>
  )

  const onFile = async (f: File | undefined) => {
    if (!f) return
    setError('')
    if (f.size > MAX_BYTES) { setError('That file is over 1 MB. Pick a smaller SVG.'); return }
    if (!/\.svg$/i.test(f.name) && f.type !== 'image/svg+xml') { setError('Only .svg files are accepted.'); return }
    const text = await f.text()
    if (!looksLikeSvg(text)) { setError('That file does not contain an <svg> element.'); return }
    setPasted(text)
  }

  const onPaste = (v: string) => {
    if (byteSize(v) > MAX_BYTES) { setError('That text is over 1 MB.'); return }
    setError('')
    setPasted(v)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result)
      setStatus('Copied to clipboard.')
    } catch {
      setStatus('Clipboard is blocked here. Use Download instead.')
    }
  }

  return (
    <div className="lab-tool">
      <header className="lab-tool__head">
        <span className="lab-soon">T.04</span>
        <h1 className="lab-tool__title">SVG Suite</h1>
        <p className="lab-note">Render, clean and download SVG.</p>
      </header>

      <div className="lab-tool__stagewrap">
        <div className="lab-stage ss-preview">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Optimised SVG preview" />
          ) : (
            <div className="ss-empty lab-note">
              {tooBig ? 'That SVG is over 200 KB, which is too large to optimise here. Trim it or optimise it with a desktop tool.' : source === 'paste' && pasted.trim() ? 'This does not look like an SVG yet. It needs an <svg> element.' : 'Paste SVG markup or upload a file to see it here.'}
            </div>
          )}
        </div>
        <div className="ss-sizes" aria-label="Size report">
          <div>Before<b>{valid ? fmt(before) : '-'}</b></div>
          <div>After<b>{valid ? fmt(after) : '-'}</b></div>
          <div className="ss-saved">Saved<b>{valid ? `${saved}%` : '-'}</b></div>
        </div>
      </div>

      <div className="lab-controls">
        <section className="lab-panel lab-section" aria-label="Source">
          <h2 className="lab-section__title">Source</h2>
          <div className="lab-seg">
            <button type="button" aria-pressed={source === 'design'} onClick={() => setSource('design')}>Current design</button>
            <button type="button" aria-pressed={source === 'paste'} onClick={() => setSource('paste')}>Paste / upload SVG</button>
          </div>
          {source === 'paste' && (
            <>
              <textarea
                className="lab-input ss-text" spellCheck={false} aria-label="SVG markup" placeholder="<svg xmlns=…>…</svg>"
                value={pasted} onChange={e => onPaste(e.target.value)}
              />
              <input type="file" accept=".svg,image/svg+xml" aria-label="Upload an SVG file" className="lab-input" onChange={e => { void onFile(e.target.files?.[0]); e.target.value = '' }} />
              <p className="lab-note">Pasted SVG is shown as an image only. Scripts never run. Optimising works up to 200 KB.</p>
            </>
          )}
          {error && <p className="lab-error" role="alert">{error}</p>}
        </section>

        <section className="lab-panel lab-section" aria-label="Optimise">
          <h2 className="lab-section__title">Optimise</h2>
          {flag('stripMeta', 'Strip comments, metadata, title, desc')}
          {flag('collapse', 'Collapse whitespace')}
          {flag('emptyGroups', 'Remove empty defs and groups')}
          {flag('editorAttrs', 'Drop editor attributes (data-part)')}
          <div className="lab-row">
            {flag('round', 'Round numbers to')}
            <select className="lab-select" aria-label="Decimals" disabled={!opts.round} value={opts.decimals} onChange={e => setOpts(o => ({ ...o, decimals: Number(e.target.value) }))}>
              {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n} decimals</option>)}
            </select>
          </div>
          <div className="lab-row">
            <span className="lab-label">Output size</span>
            <select className="lab-select" aria-label="Output size" value={size} onChange={e => setSize(Number(e.target.value))}>
              {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </section>

        <section className="lab-panel lab-section" aria-label="Export">
          <h2 className="lab-section__title">Export</h2>
          <div className="lab-row">
            <button type="button" className="lab-btn lab-btn--primary" disabled={!valid} onClick={() => { downloadText(result, `${name}.min.svg`, 'image/svg+xml'); setStatus('SVG saved.') }}>Download .svg</button>
            <button type="button" className="lab-btn" disabled={!valid} onClick={copy}>Copy</button>
          </div>
          <p className="lab-status" role="status" aria-live="polite">{status}</p>
        </section>

        <section className="lab-panel lab-section" aria-label="Base K1N0 files">
          <h2 className="lab-section__title"><Zt>Base K1N0 files</Zt></h2>
          <div className="ss-files">
            {BASE_FILES.map(f => (
              <div className="ss-file" key={f.id}>
                <span>{f.label}<small>{f.note}</small></span>
                <button type="button" className="lab-btn lab-btn--sm" onClick={() => { downloadText(baseFile(f.id), f.file, f.type); setStatus(`${f.file} saved.`) }}>{f.ext}</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
