'use client'
// One K design shared by every K.LAB tool (it carries across routes), with undo/redo
// and a local save in this browser. Slider drags coalesce into one history step.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { cloneDesign, defaultDesign, type KDesign } from './design'
import { parseDesign } from './validate'
import { coloursFrom, designFromColours, validColours } from './onchain'

const KEY = 'klab:design:v1'
const LIMIT = 100

interface Hist { past: KDesign[]; present: KDesign; future: KDesign[] }
type Action =
  | { type: 'set'; design: KDesign; merge: boolean }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'hydrate'; design: KDesign }

function reducer(s: Hist, a: Action): Hist {
  switch (a.type) {
    case 'set':
      if (a.merge) return { ...s, present: a.design, future: [] }
      return { past: [...s.past, s.present].slice(-LIMIT), present: a.design, future: [] }
    case 'undo':
      if (!s.past.length) return s
      return { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] }
    case 'redo':
      if (!s.future.length) return s
      return { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) }
    case 'hydrate':
      return { past: [], present: a.design, future: [] }
  }
}

type Updater = KDesign | ((d: KDesign) => KDesign)
interface LabApi {
  design: KDesign
  // `key` coalesces rapid edits of the same control (e.g. a slider drag) into one undo step
  set: (u: Updater, key?: string) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  reset: () => void
}

const Ctx = createContext<LabApi | null>(null)

export function LabProvider({ children }: { children: ReactNode }) {
  const [h, dispatch] = useReducer(reducer, undefined, () => ({ past: [], present: defaultDesign(), future: [] }))
  const hydrated = useRef(false)
  const last = useRef<{ key: string; at: number } | null>(null)
  const present = useRef(h.present)
  present.current = h.present

  // Restore the last design after mount (never during render: avoids hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) dispatch({ type: 'hydrate', design: parseDesign(JSON.parse(raw)) })
    } catch { /* storage blocked or old data: start from the original K */ }
    // K1N0 colours carried in the link (a wallet app opening the Lab in its own browser): #k1n0=<4 bytes>
    const m = /[#&]k1n0=([0-9a-f]{8})/i.exec(window.location.hash)
    if (m && validColours(coloursFrom(m[1]))) {
      try {
        dispatch({ type: 'hydrate', design: designFromColours(coloursFrom(m[1]), defaultDesign()) })
        history.replaceState(null, '', window.location.pathname + window.location.search)
      } catch { /* not K1N0 colours: ignore */ }
    }
    hydrated.current = true
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    const id = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(h.present)) } catch { /* private mode */ }
    }, 300)
    return () => clearTimeout(id)
  }, [h.present])

  const set = useCallback((u: Updater, key?: string) => {
    const next = typeof u === 'function' ? u(cloneDesign(present.current)) : u
    const now = performance.now()
    const merge = !!key && !!last.current && last.current.key === key && now - last.current.at < 900
    last.current = key ? { key, at: now } : null
    dispatch({ type: 'set', design: next, merge })
  }, [])
  const undo = useCallback(() => { last.current = null; dispatch({ type: 'undo' }) }, [])
  const redo = useCallback(() => { last.current = null; dispatch({ type: 'redo' }) }, [])
  const reset = useCallback(() => set(defaultDesign()), [set])

  // Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z, Ctrl+Y (text fields keep their own undo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'text'))) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  const api = useMemo<LabApi>(
    () => ({ design: h.present, set, undo, redo, canUndo: h.past.length > 0, canRedo: h.future.length > 0, reset }),
    [h, set, undo, redo, reset],
  )
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useLab(): LabApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useLab must be used inside <LabProvider>')
  return v
}
