'use client'
// Pixel Forge (T.02): draw the K one pixel at a time.
// Painting happens in a local draft (ref + canvas); the design is committed at most once per
// animation frame under one history key per stroke, so a stroke is a single undo step.
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { BRAND, SWATCHES } from '@/lib/lab/base'
import { GRID_SIZES, presetGrid, type KDesign } from '@/lib/lab/design'
import { exportJson, exportPng, exportSvg } from '@/lib/lab/export'
import { renderSvg } from '@/lib/lab/render'
import { isHex } from '@/lib/lab/validate'
import { useLab } from '@/lib/lab/store'

type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper'
type PaletteMode = 'k' | 'free'

const RES = 960 // canvas pixels; divisible by 16, 24, 32 and 48
const TOOLS: { id: Tool; label: string; key: string }[] = [
  { id: 'pencil', label: 'Pencil', key: 'B' },
  { id: 'eraser', label: 'Eraser', key: 'E' },
  { id: 'fill', label: 'Fill', key: 'G' },
  { id: 'eyedropper', label: 'Pick', key: 'I' },
]
const K_PALETTE: { name: string; hex: string }[] = [
  { name: 'Yellow', hex: BRAND.yellow },
  { name: 'Ink', hex: BRAND.ink },
  { name: 'Pink', hex: BRAND.pink },
  { name: 'Purple', hex: BRAND.purple },
  { name: 'Cream', hex: BRAND.cream },
]
const K_HEXES: string[] = K_PALETTE.map(c => c.hex)

// ── Pure grid helpers ──────────────────────────────────────────────────────
function normalize(cells: string[], size: number): string[] {
  const out = cells.slice(0, size * size)
  while (out.length < size * size) out.push('')
  return out
}

function resample(cells: string[], from: number, to: number): string[] {
  const out: string[] = new Array(to * to).fill('')
  for (let y = 0; y < to; y++) {
    const sy = Math.min(from - 1, Math.floor(((y + 0.5) * from) / to))
    for (let x = 0; x < to; x++) {
      const sx = Math.min(from - 1, Math.floor(((x + 0.5) * from) / to))
      out[y * to + x] = cells[sy * from + sx] ?? ''
    }
  }
  return out
}

function floodFill(cells: string[], size: number, x: number, y: number, value: string): boolean {
  const target = cells[y * size + x]
  if (target === value) return false
  const stack = [y * size + x]
  while (stack.length) {
    const i = stack.pop() as number
    if (cells[i] !== target) continue
    cells[i] = value
    const cx = i % size
    const cy = (i - cx) / size
    if (cx > 0) stack.push(i - 1)
    if (cx < size - 1) stack.push(i + 1)
    if (cy > 0) stack.push(i - size)
    if (cy < size - 1) stack.push(i + size)
  }
  return true
}

function* linePoints(x0: number, y0: number, x1: number, y1: number): Generator<[number, number]> {
  let x = x0
  let y = y0
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    yield [x, y]
    if (x === x1 && y === y1) return
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x += sx }
    if (e2 <= dx) { err += dx; y += sy }
  }
}

const bodyColour = (d: KDesign) => (d.body.fill.kind === 'solid' && isHex(d.body.fill.a) ? d.body.fill.a : BRAND.ink)

interface Stroke {
  id: number
  tool: Tool
  draft: string[]
  last: [number, number]
  dirty: boolean
  raf: number
  ended: boolean
}

export default function PixelForge() {
  const { design, set, undo, redo, canUndo, canRedo } = useLab()
  const [tool, setTool] = useState<Tool>('pencil')
  const [mirror, setMirror] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [mode, setMode] = useState<PaletteMode>('k')
  const [color, setColor] = useState<string>(BRAND.ink)
  const [status, setStatus] = useState('')
  const [cursorMsg, setCursorMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokeRef = useRef<Stroke | null>(null)
  const strokeSeq = useRef(0)
  const hoverRef = useRef<[number, number] | null>(null)
  const cursorRef = useRef<[number, number]>([0, 0])
  const focusedRef = useRef(false)

  const isPixel = design.form === 'pixel'
  const size = design.grid.size

  // The SVG shows bg and effects; the canvas on top draws the pixels live.
  const underlay = useMemo(
    () => renderSvg({ ...design, grid: { ...design.grid, cells: [] } }, { uid: 'pf', t: 0 }),
    [design],
  )

  // ── Canvas drawing (reads refs, so it never needs React state per pointer move) ──
  const redraw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, RES, RES)
    if (design.form !== 'pixel') return
    const n = design.grid.size
    const cells = strokeRef.current?.draft ?? design.grid.cells
    const cell = RES / n
    const g = design.grid.gap * cell
    for (let i = 0; i < n * n; i++) {
      const v = cells[i]
      if (!v || !isHex(v)) continue
      ctx.fillStyle = v
      ctx.fillRect((i % n) * cell + g / 2, Math.floor(i / n) * cell + g / 2, cell - g, cell - g)
    }
    if (showGrid) {
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(255, 246, 220, 0.16)'
      ctx.beginPath()
      for (let k = 0; k <= n; k++) {
        const p = Math.round(k * cell) + 0.5
        ctx.moveTo(p, 0); ctx.lineTo(p, RES)
        ctx.moveTo(0, p); ctx.lineTo(RES, p)
      }
      ctx.stroke()
    }
    if (mirror) {
      ctx.strokeStyle = 'rgba(251, 197, 0, 0.45)'
      ctx.setLineDash([8, 8])
      ctx.beginPath()
      ctx.moveTo(RES / 2, 0); ctx.lineTo(RES / 2, RES)
      ctx.stroke()
      ctx.setLineDash([])
    }
    const mark = (c: [number, number] | null, w: number) => {
      if (!c) return
      ctx.lineWidth = w
      ctx.strokeStyle = '#0f0d0a'
      ctx.strokeRect(c[0] * cell + 1, c[1] * cell + 1, cell - 2, cell - 2)
      ctx.lineWidth = Math.max(1, w - 2)
      ctx.strokeStyle = '#fff6dc'
      ctx.strokeRect(c[0] * cell + 1.5, c[1] * cell + 1.5, cell - 3, cell - 3)
    }
    mark(hoverRef.current, 3)
    if (focusedRef.current) mark(cursorRef.current, 4)
  }, [design.form, design.grid.cells, design.grid.gap, design.grid.size, showGrid, mirror])

  useEffect(() => {
    if (strokeRef.current?.ended) strokeRef.current = null
    redraw()
  }, [redraw])

  // Keep the keyboard cursor inside the grid when the size changes
  useEffect(() => {
    cursorRef.current = [Math.min(cursorRef.current[0], size - 1), Math.min(cursorRef.current[1], size - 1)]
    hoverRef.current = null
  }, [size])

  // ── Painting ────────────────────────────────────────────────────────────
  const paintColor = tool === 'eraser' ? '' : color

  const put = useCallback((draft: string[], n: number, x: number, y: number, tl: Tool, col: string): boolean => {
    const value = tl === 'eraser' ? '' : col
    let changed = false
    const write = (px: number) => {
      const i = y * n + px
      if (draft[i] !== value) { draft[i] = value; changed = true }
    }
    write(x)
    if (mirror) write(n - 1 - x)
    return changed
  }, [mirror])

  const pick = useCallback((v: string) => {
    if (!v) { setTool('eraser'); return }
    setColor(v)
    if (!K_HEXES.includes(v)) setMode('free')
    setTool('pencil')
  }, [])

  const commit = useCallback((draft: string[], key?: string) => {
    set(d => {
      if (draft.length === d.grid.size * d.grid.size) d.grid.cells = draft.slice()
      return d
    }, key)
  }, [set])

  const flush = useCallback((s: Stroke) => {
    if (s.raf) { cancelAnimationFrame(s.raf); s.raf = 0 }
    if (!s.dirty) return
    s.dirty = false
    commit(s.draft, `paint-${s.id}`)
  }, [commit])

  const cellAt = (e: ReactPointerEvent<HTMLCanvasElement>): [number, number] | null => {
    const r = e.currentTarget.getBoundingClientRect()
    if (!r.width || !r.height) return null
    const x = Math.floor(((e.clientX - r.left) / r.width) * size)
    const y = Math.floor(((e.clientY - r.top) / r.height) * size)
    if (x < 0 || y < 0 || x >= size || y >= size) return null
    return [x, y]
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isPixel || (e.pointerType === 'mouse' && e.button !== 0)) return
    const c = cellAt(e)
    if (!c) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const draft = normalize(design.grid.cells, size)
    if (tool === 'eyedropper') { pick(draft[c[1] * size + c[0]]); return }
    const s: Stroke = { id: ++strokeSeq.current, tool, draft, last: c, dirty: false, raf: 0, ended: false }
    strokeRef.current = s
    if (tool === 'fill') s.dirty = floodFill(draft, size, c[0], c[1], paintColor)
    else s.dirty = put(draft, size, c[0], c[1], tool, color)
    redraw()
    if (s.dirty) flush(s)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isPixel) return
    const c = cellAt(e)
    const prev = hoverRef.current
    hoverRef.current = e.pointerType === 'mouse' ? c : null
    const s = strokeRef.current
    if (s && !s.ended && s.tool !== 'fill' && c && (c[0] !== s.last[0] || c[1] !== s.last[1])) {
      for (const [x, y] of linePoints(s.last[0], s.last[1], c[0], c[1])) {
        if (put(s.draft, size, x, y, s.tool, color)) s.dirty = true
      }
      s.last = c
      if (s.dirty && !s.raf) {
        s.raf = requestAnimationFrame(() => { s.raf = 0; flush(s) })
      }
      redraw()
    } else if (!s && (prev?.[0] !== hoverRef.current?.[0] || prev?.[1] !== hoverRef.current?.[1])) {
      redraw()
    }
  }

  const endStroke = () => {
    const s = strokeRef.current
    if (!s || s.ended) return
    flush(s)
    s.ended = true
    redraw()
  }

  const onPointerLeave = () => {
    if (strokeRef.current && !strokeRef.current.ended) return
    hoverRef.current = null
    redraw()
  }

  // ── Keyboard cursor on the paint surface ────────────────────────────────
  const paintAtCursor = () => {
    const [x, y] = cursorRef.current
    const draft = normalize(design.grid.cells, size)
    if (tool === 'eyedropper') { pick(draft[y * size + x]); return }
    const changed = tool === 'fill' ? floodFill(draft, size, x, y, paintColor) : put(draft, size, x, y, tool, color)
    if (changed) commit(draft)
  }

  const onCanvasKey = (e: ReactKeyboardEvent<HTMLCanvasElement>) => {
    if (!isPixel || e.ctrlKey || e.metaKey || e.altKey) return
    const [x, y] = cursorRef.current
    let nx = x
    let ny = y
    if (e.key === 'ArrowLeft') nx = Math.max(0, x - 1)
    else if (e.key === 'ArrowRight') nx = Math.min(size - 1, x + 1)
    else if (e.key === 'ArrowUp') ny = Math.max(0, y - 1)
    else if (e.key === 'ArrowDown') ny = Math.min(size - 1, y + 1)
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      paintAtCursor()
      setCursorMsg(`Painted column ${x + 1}, row ${y + 1}`)
      return
    } else {
      const k = e.key.toLowerCase()
      const t = TOOLS.find(x2 => x2.key.toLowerCase() === k)
      if (t) { e.preventDefault(); setTool(t.id) }
      else if (k === 'm') { e.preventDefault(); setMirror(m => !m) }
      return
    }
    e.preventDefault()
    cursorRef.current = [nx, ny]
    const v = normalize(design.grid.cells, size)[ny * size + nx]
    setCursorMsg(`Column ${nx + 1}, row ${ny + 1}, ${v ? v : 'empty'}`)
    redraw()
  }

  // ── Design actions ──────────────────────────────────────────────────────
  const startFromPreset = () =>
    set(d => {
      d.form = 'pixel'
      d.grid.cells = presetGrid(d.grid.size, d.head.cubes, bodyColour(d))
      return d
    })
  const useExistingGrid = () => set(d => { d.form = 'pixel'; d.grid.cells = normalize(d.grid.cells, d.grid.size); return d })
  const backToVector = () => set(d => { d.form = 'vector'; return d })
  const resetPreset = () => set(d => { d.grid.cells = presetGrid(d.grid.size, d.head.cubes, bodyColour(d)); return d })
  const clearGrid = () => set(d => { d.grid.cells = new Array(d.grid.size * d.grid.size).fill(''); return d })
  const changeSize = (to: number) =>
    set(d => {
      d.grid.cells = resample(normalize(d.grid.cells, d.grid.size), d.grid.size, to)
      d.grid.size = to
      return d
    })
  const setBg = (hex: string) => set(d => { d.bg = { ...d.bg, visible: true, fill: { kind: 'solid', a: hex } }; return d })

  const chooseMode = (m: PaletteMode) => {
    setMode(m)
    if (m === 'k' && !K_HEXES.includes(color)) setColor(BRAND.ink)
  }

  const run = async (label: string, fn: () => void | Promise<void>) => {
    if (busy) return
    setBusy(true)
    setStatus('')
    try {
      await fn()
      setStatus(`${label} saved.`)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : `${label} export failed.`)
    } finally {
      setBusy(false)
    }
  }

  const swatches = mode === 'k' ? K_HEXES : SWATCHES
  const bgNow = design.bg.fill.kind === 'solid' ? design.bg.fill.a.toLowerCase() : ''

  return (
    <div className="lab-tool">
      <header className="lab-tool__head">
        <h1 className="lab-tool__title">Pixel Forge</h1>
        <span className="lab-label">T.02</span>
        <p className="lab-note">Draw the K one pixel at a time.</p>
      </header>

      <div className="lab-tool__stagewrap">
        <div className="lab-stage">
          <div className="lab-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: underlay }} />
          <canvas
            ref={canvasRef}
            width={RES}
            height={RES}
            className={isPixel ? 'pf-canvas' : 'pf-canvas pf-canvas--off'}
            role="application"
            aria-roledescription="pixel canvas"
            aria-label={`Pixel canvas, ${size} by ${size}. Tool: ${tool}.`}
            aria-describedby="pf-kbd-note"
            tabIndex={isPixel ? 0 : -1}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onLostPointerCapture={endStroke}
            onPointerLeave={onPointerLeave}
            onKeyDown={onCanvasKey}
            onFocus={() => { focusedRef.current = true; redraw() }}
            onBlur={() => { focusedRef.current = false; redraw() }}
          />
          {!isPixel && (
            <div className="pf-start">
              <p className="lab-label">Vector design loaded</p>
              <p className="lab-note">Your vector K stays untouched until you choose.</p>
              <button type="button" className="lab-btn lab-btn--primary" onClick={startFromPreset}>Start from the K preset</button>
              <button type="button" className="lab-btn lab-btn--ghost lab-btn--sm" onClick={useExistingGrid}>Edit my saved grid</button>
            </div>
          )}
        </div>
        <p id="pf-kbd-note" className="lab-sr">
          Keyboard: focus the canvas, move the cursor cell with the arrow keys, press Space or Enter to paint with the current tool. B, E, G, I select tools and M toggles mirror while the canvas is focused.
        </p>
        <p className="pf-hint">Keyboard: arrows move, Space paints.</p>
        <p className="lab-sr" aria-live="polite">{cursorMsg}</p>

        <div className="lab-bar">
          <button type="button" className="lab-btn lab-btn--sm" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">Undo</button>
          <button type="button" className="lab-btn lab-btn--sm" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">Redo</button>
          <button type="button" className="lab-btn lab-btn--sm lab-btn--primary" aria-disabled={busy} onClick={() => run('PNG', () => exportPng(design, 2048))}>PNG</button>
          <button type="button" className="lab-btn lab-btn--sm" aria-disabled={busy} onClick={() => run('SVG', () => exportSvg(design))}>SVG</button>
          <button type="button" className="lab-btn lab-btn--sm" aria-disabled={busy} onClick={() => run('JSON', () => exportJson(design))}>JSON</button>
        </div>
        <p className="lab-status" role="status">{status}</p>
      </div>

      <div className="lab-controls">
        <section className="lab-panel lab-section" aria-label="Tools">
          <h2 className="lab-section__title">Tools</h2>
          <div className="pf-tools">
            {TOOLS.map(t => (
              <button
                key={t.id}
                type="button"
                className="lab-btn"
                aria-pressed={tool === t.id}
                title={`${t.label} (${t.key}, when the canvas is focused)`}
                onClick={() => setTool(t.id)}
              >
                {t.label} <kbd>{t.key}</kbd>
              </button>
            ))}
          </div>
          <div className="lab-row">
            <label className="lab-check" title="Mirror around the vertical centre (M, when the canvas is focused)">
              <input type="checkbox" checked={mirror} onChange={e => setMirror(e.target.checked)} />
              Mirror X
            </label>
            <label className="lab-check">
              <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
              Grid lines
            </label>
          </div>
        </section>

        <section className="lab-panel lab-section" aria-label="Colour">
          <div className="pf-headrow">
            <h2 className="lab-section__title">Colour</h2>
            <span className="lab-seg" role="group" aria-label="Palette">
              <button type="button" aria-pressed={mode === 'k'} onClick={() => chooseMode('k')}>K palette</button>
              <button type="button" aria-pressed={mode === 'free'} onClick={() => chooseMode('free')}>Free</button>
            </span>
          </div>
          <div className="lab-row">
            <span className="pf-chip" title={`Current colour ${color}`} role="img" aria-label={`Current colour ${color}`}>
              <span style={{ background: tool === 'eraser' ? 'transparent' : color }} />
            </span>
            <span className="lab-label">{tool === 'eraser' ? 'Eraser' : color}</span>
            {mode === 'free' && (
              <label className="lab-color">
                <input type="color" value={color} aria-label="Custom colour" onChange={e => { setColor(e.target.value); if (tool === 'eraser' || tool === 'eyedropper') setTool('pencil') }} />
                Custom
              </label>
            )}
          </div>
          <div className="lab-swatches" role="group" aria-label="Swatches">
            {swatches.map(hex => (
              <button
                key={hex}
                type="button"
                className="lab-swatch"
                style={{ background: hex }}
                aria-pressed={color.toLowerCase() === hex.toLowerCase()}
                aria-label={K_PALETTE.find(c => c.hex === hex)?.name ?? hex}
                title={K_PALETTE.find(c => c.hex === hex)?.name ?? hex}
                onClick={() => { setColor(hex); if (tool === 'eraser' || tool === 'eyedropper') setTool('pencil') }}
              />
            ))}
          </div>
        </section>

        <section className="lab-panel lab-section" aria-label="Grid">
          <h2 className="lab-section__title">Grid</h2>
          <div className="lab-row">
            <label className="lab-label" htmlFor="pf-size">Size</label>
            <select id="pf-size" className="lab-select" value={size} onChange={e => changeSize(Number(e.target.value))}>
              {GRID_SIZES.map(s => <option key={s} value={s}>{s} x {s}</option>)}
            </select>
          </div>
          <label className="lab-range">
            <span className="lab-label">Gap</span>
            <input
              type="range"
              min={0}
              max={0.4}
              step={0.01}
              value={design.grid.gap}
              onChange={e => { const v = Number(e.target.value); set(d => { d.grid.gap = v; return d }, 'pf-gap') }}
            />
            <output>{Math.round(design.grid.gap * 100)}%</output>
          </label>
          <div className="lab-row">
            <button type="button" className="lab-btn lab-btn--sm" onClick={resetPreset}>Reset to K preset</button>
            <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={clearGrid}>Clear</button>
            {isPixel && <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={backToVector}>Back to vector</button>}
          </div>
        </section>

        <section className="lab-panel lab-section" aria-label="Background">
          <h2 className="lab-section__title">Background</h2>
          <div className="lab-swatches" role="group" aria-label="Background colour">
            {(mode === 'k' ? K_HEXES : SWATCHES).map(hex => (
              <button
                key={hex}
                type="button"
                className="lab-swatch"
                style={{ background: hex }}
                aria-pressed={design.bg.visible && bgNow === hex.toLowerCase()}
                aria-label={`Background ${K_PALETTE.find(c => c.hex === hex)?.name ?? hex}`}
                title={`Background ${K_PALETTE.find(c => c.hex === hex)?.name ?? hex}`}
                onClick={() => setBg(hex)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
