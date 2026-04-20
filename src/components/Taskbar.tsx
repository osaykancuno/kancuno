'use client'

import { useState, useEffect } from 'react'
import { useWindowManager } from './WindowManager'

export default function Taskbar() {
  const {
    windows, openWindow, restoreWindow, minimizeWindow, focusWindow,
  } = useWindowManager()
  const [time, setTime] = useState('')
  const [startOpen, setStartOpen] = useState(false)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [])

  const openStaticWindows = windows.filter(w => w.isOpen)

  const maxZ = Math.max(
    ...openStaticWindows.filter(w => !w.isMinimized).map(w => w.zIndex),
    0,
  )

  // Smart click: if window is minimized → restore+focus
  //              if open but not top → focus
  //              if open and top → minimize
  const handleStaticClick = (id: typeof windows[0]['id']) => {
    const w = windows.find(x => x.id === id)!
    if (w.isMinimized) { restoreWindow(id); return }
    if (w.zIndex === maxZ) { minimizeWindow(id) } else { focusWindow(id) }
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
              { id: 'about'    as const, label: 'PROFILE.EXE'  },
              { id: 'works'    as const, label: 'WORKS.EXE'    },
              { id: 'normies'  as const, label: 'NORMIES.EXE'  },
              { id: 'khorafun' as const, label: 'KHORAFUN.EXE' },
              { id: 'contact'  as const, label: 'CONTACT.EXE'  },
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
              href="https://x.com/OsayKancuno" target="_blank" rel="noopener noreferrer"
              className="w-full text-left px-3 py-2 hover:bg-[#48494b] hover:text-white transition-colors block"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}
              onClick={() => setStartOpen(false)}
            >
              TWITTER.EXE
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

      {/* Right: Twitter + clock */}
      <div className="flex items-center gap-3 ml-auto pl-2" style={{ borderLeft: '2px solid #48494b', paddingLeft: 8 }}>
        <a
          href="https://x.com/OsayKancuno" target="_blank" rel="noopener noreferrer"
          title="Twitter / X"
          style={{ fontSize: 16, color: '#48494b', textDecoration: 'none' }}
        >𝕏</a>
        <span style={{ fontSize: 9, color: '#48494b', letterSpacing: 1, whiteSpace: 'nowrap' }}>{time}</span>
      </div>
    </div>
  )
}
