'use client'

import { useEffect, useRef, useState } from 'react'
import { STATIONS } from './content'

// Optional background radio (SomaFM streams). Off by default; nothing loads until played.
export default function SoundToggle() {
  const [playing, setPlaying] = useState(false)
  const [idx, setIdx] = useState(0)
  const audio = useRef<HTMLAudioElement | null>(null)

  // Fully release a stream (pausing alone keeps the connection open)
  const release = (a: HTMLAudioElement | null) => {
    if (!a) return
    a.pause()
    a.removeAttribute('src')
    a.load()
  }

  useEffect(() => () => release(audio.current), [])

  const toggle = () => {
    if (!audio.current) audio.current = new Audio(STATIONS[idx].url)
    if (playing) {
      // Live radio: drop the stream so resuming starts from "now", not stale buffer
      release(audio.current)
      audio.current = null
      setPlaying(false)
    } else {
      setPlaying(true)
      audio.current.play().catch(() => setPlaying(false))
    }
  }

  const next = () => {
    const n = (idx + 1) % STATIONS.length
    setIdx(n)
    if (audio.current) {
      release(audio.current)
      audio.current = new Audio(STATIONS[n].url)
      if (playing) audio.current.play().catch(() => setPlaying(false))
    }
  }

  return (
    <div className="k-sound">
      <button
        type="button"
        className="k-sound-btn"
        onClick={toggle}
        aria-pressed={playing}
      >
        <span className="k-eq" data-on={playing ? '' : undefined} aria-hidden="true">
          <i /><i /><i /><i />
        </span>
        <span className="k-sound-label">Sound</span>
        {playing && <span className="k-sound-station">· {STATIONS[idx].name}</span>}
      </button>
      {playing && (
        <button type="button" className="k-sound-next" onClick={next} aria-label="Next radio station">»</button>
      )}
    </div>
  )
}
