'use client'

import { useEffect, useState } from 'react'

// Every visit boots in the old Normies palette (set before first paint by the
// inline script in layout.tsx), glitches, and mutates into NEONFACES neon.

const GLITCH_START = 350
const SETTLE       = 1300
const GLITCH_END   = 1550
// Palette flips between neon and normie at these moments before settling.
const FLICKER = [420, 520, 600, 760, 820, 980, 1060, 1180]

type Bar = { top: number; height: number; x: number; opacity: number }

const randomBars = (): Bar[] =>
  Array.from({ length: 3 + Math.floor(Math.random() * 5) }, () => ({
    top: Math.random() * 100,
    height: 2 + Math.random() * 18,
    x: (Math.random() - 0.5) * 40,
    opacity: 0.35 + Math.random() * 0.65,
  }))

export default function MutationIntro() {
  const [active, setActive] = useState(false)
  const [bars, setBars]     = useState<Bar[]>([])

  useEffect(() => {
    const html = document.documentElement
    // Reduced motion (or a late hydration) skips the intro: palette is already neon.
    if (html.getAttribute('data-palette') !== 'normie') return

    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
    let barsTimer = 0

    at(GLITCH_START, () => {
      html.setAttribute('data-mutating', '')
      setActive(true)
      setBars(randomBars())
      barsTimer = window.setInterval(() => setBars(randomBars()), 70)
    })
    FLICKER.forEach((ms, i) => at(ms, () => {
      if (i % 2 === 0) html.removeAttribute('data-palette')
      else html.setAttribute('data-palette', 'normie')
    }))
    at(SETTLE, () => html.removeAttribute('data-palette'))
    at(GLITCH_END, () => {
      html.removeAttribute('data-mutating')
      window.clearInterval(barsTimer)
      setActive(false)
    })

    return () => {
      timers.forEach(t => window.clearTimeout(t))
      window.clearInterval(barsTimer)
      html.removeAttribute('data-mutating')
    }
  }, [])

  if (!active) return null

  return (
    <div className="nf-mutation-overlay" aria-hidden="true">
      {bars.map((b, i) => (
        <div
          key={i}
          className="nf-mutation-bar"
          style={{ top: `${b.top}%`, height: b.height, opacity: b.opacity, transform: `translateX(${b.x}px)` }}
        />
      ))}
    </div>
  )
}
