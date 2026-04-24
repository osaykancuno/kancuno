'use client'

import { useState, useEffect, useRef } from 'react'
import { useWindowManager } from './WindowManager'

const STATIONS = [
  { name: 'LO-FI',   url: 'https://ice1.somafm.com/groovesalad-128-mp3'   },
  { name: 'AMBIENT',  url: 'https://ice1.somafm.com/dronezone-128-mp3'     },
  { name: 'INDIE',    url: 'https://ice1.somafm.com/indiepop-128-mp3'      },
  { name: 'SPACE',    url: 'https://ice1.somafm.com/spacestation-128-mp3'  },
  { name: 'JAZZ',     url: 'https://ice1.somafm.com/sonicuniverse-128-mp3' },
]

export default function Taskbar() {
  const { windows, openWindow, restoreWindow, minimizeWindow, focusWindow } = useWindowManager()
  const [time, setTime]         = useState('')
  const [startOpen, setStartOpen] = useState(false)
  const [dark, setDark]         = useState(true)
  const [playing, setPlaying]   = useState(false)
  const [stationIdx, setStationIdx] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      setDark(false)
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(STATIONS[stationIdx].url)
    }
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play().catch(() => {})
      setPlaying(true)
    }
  }

  const nextStation = () => {
    const next = (stationIdx + 1) % STATIONS.length
    setStationIdx(next)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = new Audio(STATIONS[next].url)
      if (playing) audioRef.current.play().catch(() => {})
    }
  }

  const openStaticWindows = windows.filter(w => w.isOpen)
  const maxZ = Math.max(
    ...openStaticWindows.filter(w => !w.isMinimized).map(w => w.zIndex),
    0,
  )

  const handleStaticClick = (id: typeof windows[0]['id']) => {
    const w = windows.find(x => x.id === id)!
    if (w.isMinimized) { restoreWindow(id); return }
    if (w.zIndex === maxZ) { minimizeWindow(id) } else { focusWindow(id) }
  }

  const btnStyle = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
    color: '#48494b', padding: '2px 4px',
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex items-center gap-2 px-2"
      style={{
        height: 40,
        background: '#e3e5e4',
        borderTop: '2px solid #48494b',
        boxShadow: '0 -2px 0 #000',
        zIndex: 9999,
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      {/* Start button */}
      <div className="relative">
        <button
          className="pixel-btn flex items-center gap-1"
          style={{ fontSize: 9, padding: '4px 8px' }}
          onClick={() => setStartOpen(o => !o)}
        >
          <span>▶</span> START
        </button>

        {startOpen && (
          <div
            className="absolute bottom-full left-0 mb-1 pixel-border bg-[#e3e5e4] min-w-[160px]"
            style={{ zIndex: 10000 }}
          >
            {[
              { id: 'about'    as const, label: 'PROFILE'  },
              { id: 'works'    as const, label: 'WORKS'    },
              { id: 'normies'  as const, label: 'NORMIES'  },
              { id: 'khorafun' as const, label: 'KHORAFUN' },
              { id: 'contact'  as const, label: 'CONTACT'  },
            ].map(item => (
              <button
                key={item.id}
                className="w-full text-left px-3 py-2 hover:bg-[#48494b] hover:text-white transition-colors"
                style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, display: 'block' }}
                onClick={() => { openWindow(item.id); setStartOpen(false) }}
              >
                {item.label}
              </button>
            ))}
            <div style={{ borderTop: '1px solid #48494b', margin: '2px 0' }} />
            <a
              href="https://line.kancuno.com/" target="_blank" rel="noopener noreferrer"
              className="w-full text-left px-3 py-2 hover:bg-[#48494b] hover:text-white transition-colors block"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}
              onClick={() => setStartOpen(false)}
            >
              ATB / LINE
            </a>
            <a
              href="https://x.com/OsayKancuno" target="_blank" rel="noopener noreferrer"
              className="w-full text-left px-3 py-2 hover:bg-[#48494b] hover:text-white transition-colors block"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}
              onClick={() => setStartOpen(false)}
            >
              TWITTER
            </a>
          </div>
        )}
      </div>

      {/* Separator */}
      <div style={{ width: 2, height: 28, background: '#48494b', flexShrink: 0 }} />

      {/* Open windows */}
      <div className="flex gap-1 flex-1 overflow-x-auto">
        {openStaticWindows.map(w => {
          const isFocused = !w.isMinimized && w.zIndex === maxZ
          return (
            <button
              key={w.id}
              className="pixel-btn truncate"
              title={w.title}
              style={{
                fontSize: 7, padding: '3px 6px', maxWidth: 130,
                background: isFocused ? '#48494b' : w.isMinimized ? 'transparent' : '#9a9c9b',
                color: isFocused ? '#ffffff' : '#48494b',
                borderStyle: w.isMinimized ? 'dashed' : 'solid',
              }}
              onClick={() => handleStaticClick(w.id)}
            >
              {w.title}
            </button>
          )
        })}
      </div>

      {/* Right: radio + theme toggle + clock */}
      <div className="flex items-center gap-2 ml-auto" style={{ borderLeft: '2px solid #48494b', paddingLeft: 8 }}>

        {/* Radio player */}
        <div className="flex items-center gap-1">
          <button onClick={togglePlay} title={playing ? 'Pause' : 'Play radio'} style={{ ...btnStyle, fontSize: 8 }}>
            {playing ? '■' : '▶'}
          </button>
          <span style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            color: playing ? '#48494b' : '#9a9c9b',
            minWidth: 44, letterSpacing: 0,
          }}>
            {STATIONS[stationIdx].name}
          </span>
          <button onClick={nextStation} title="Next station" style={{ ...btnStyle, fontSize: 8 }}>
            »
          </button>
        </div>

        <div style={{ width: 1, height: 20, background: '#48494b' }} />

        {/* Theme toggle */}
        <button
          onClick={() => {
            const next = !dark
            setDark(next)
            document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
            localStorage.setItem('theme', next ? 'dark' : 'light')
          }}
          title={dark ? 'Light mode' : 'Dark mode'}
          style={{ ...btnStyle, fontSize: 8 }}
        >
          {dark ? '☀' : '☾'}
        </button>

        {/* Clock */}
        <span style={{ fontSize: 9, color: '#48494b', letterSpacing: 1, whiteSpace: 'nowrap' }}>
          {time}
        </span>
      </div>
    </div>
  )
}
