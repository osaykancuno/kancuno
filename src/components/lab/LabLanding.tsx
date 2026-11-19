'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BASE_FILES, baseFile } from '@/lib/lab/base-files'
import { cloneDesign, defaultDesign, PRESETS, remix, type KDesign } from '@/lib/lab/design'
import { downloadText } from '@/lib/lab/export'
import { useLab } from '@/lib/lab/store'
import { KPreview, KThumb, useReducedMotion } from './KArt'

// Hero: the K cycling through its variations
export function HeroK() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const [stopped, setStopped] = useState(false) // the visitor's choice
  const [held, setHeld] = useState(false) // hover or focus inside the figure
  const paused = stopped || held || reduce
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setI(n => (n + 1) % PRESETS.length), 2600)
    return () => clearInterval(id)
  }, [paused])
  const d = PRESETS[i]
  return (
    <figure
      className="kl-hero__art"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false) }}
    >
      <div className="kl-hero__frame">
        <KPreview design={d} uid="hero" animate paused={stopped} orbit label={`K1N0 in one of its variations: ${d.name}`} />
      </div>
      <figcaption className="kl-hero__cap">
        <span className="lab-label">Variation {String(i + 1).padStart(2, '0')} / {String(PRESETS.length).padStart(2, '0')} · {d.name} · Drag to turn</span>
        <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => setStopped(s => !s)}>
          {stopped ? 'Play' : 'Pause'}
        </button>
      </figcaption>
    </figure>
  )
}

export function BaseDownloads() {
  return (
    <ul className="kl-files">
      {BASE_FILES.map(f => (
        <li key={f.id}>
          <button type="button" className="kl-file" onClick={() => downloadText(baseFile(f.id), f.file, f.type)}>
            <span className="kl-file__ext">{f.ext}</span>
            <span className="kl-file__name">{f.label}</span>
            <span className="kl-file__note">{f.note}</span>
            <span className="kl-file__get" aria-hidden="true">↓</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

// Deterministic variations for the wall (same on every visit)
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const WALL: KDesign[] = [
  ...PRESETS,
  ...Array.from({ length: 4 }, (_, i) => remix(defaultDesign(), seeded(8362 + i * 101))),
]

export function SampleWall() {
  const { set } = useLab()
  return (
    <ul className="kl-wall">
      {WALL.map((d, i) => (
        <li key={i}>
          <Link href="/klab/editor" className="kl-wall__item" onClick={() => set(cloneDesign(d))} aria-label={`Open ${d.name} in the K Editor`}>
            <KThumb design={d} alt="" size={240} />
            <span className="kl-wall__meta"><span>{d.name}</span><span>Off-chain</span></span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
