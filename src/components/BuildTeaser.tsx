'use client'

import { useEffect, useState } from 'react'

// "Something is being built" teaser: the word glitches into noise now and then,
// and the progress bar creeps toward done but never gets there. Everything is
// drawn in currentColor so the parent decides the tone.

const WORD  = 'INTERESTING'
const NOISE = '#@$%&?!/<>*+=01'
const CELLS = 12

const scramble = (s: string, amount: number) =>
  s.split('').map(c => (Math.random() < amount ? NOISE[Math.floor(Math.random() * NOISE.length)] : c)).join('')

export default function BuildTeaser({ compact = false }: { compact?: boolean }) {
  const [word, setWord]     = useState(WORD)
  const [filled, setFilled] = useState(7)
  const [noisy, setNoisy]   = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timers: number[] = []
    // Short bursts of scrambled letters, then back to the real word
    const burst = window.setInterval(() => {
      for (let f = 0; f < 6; f++) {
        timers.push(window.setTimeout(() => setWord(scramble(WORD, 0.45)), f * 55))
      }
      timers.push(window.setTimeout(() => setWord(WORD), 6 * 55))
    }, 2800)

    // One cell at a time up to 11/12, stall, glitch, slip back a few cells
    let n = 7
    const progress = window.setInterval(() => {
      if (n < CELLS - 1) {
        setFilled(++n)
        return
      }
      n = CELLS - 4
      setNoisy(true)
      timers.push(window.setTimeout(() => { setNoisy(false); setFilled(n) }, 450))
    }, 1100)

    return () => {
      window.clearInterval(burst)
      window.clearInterval(progress)
      timers.forEach(t => window.clearTimeout(t))
    }
  }, [])

  const cell = compact ? 5 : 7
  const pct  = noisy ? '??%' : `${Math.round((filled / CELLS) * 100)}%`

  return (
    <div
      role="status"
      aria-label="Building something interesting"
      style={{ fontFamily: "'Press Start 2P', monospace", fontSize: compact ? 6 : 8, lineHeight: 2 }}
    >
      <div aria-hidden="true">
        &gt; BUILDING SOMETHING{compact ? ' ' : <br />}
        <span className="nf-glitch">{word}</span>
        <span className="nf-cursor">_</span>
      </div>
      <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: compact ? 2 : 4 }}>
        <div className={noisy ? 'nf-glitch-burst' : undefined} style={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: CELLS }, (_, i) => {
            const on = noisy ? Math.random() < 0.5 : i < filled
            return (
              <div key={i} style={{
                width: cell, height: cell,
                background: on ? 'currentColor' : 'transparent',
                border: '1px solid currentColor',
                opacity: on ? 1 : 0.35,
              }} />
            )
          })}
        </div>
        <span style={{ minWidth: compact ? 18 : 24 }}>{pct}</span>
      </div>
      {!compact && (
        <div aria-hidden="true" style={{ fontSize: 6, opacity: 0.6, marginTop: 4 }}>
          STATUS: CLASSIFIED
        </div>
      )}
    </div>
  )
}
