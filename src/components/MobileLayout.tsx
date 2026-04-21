'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import AboutWindow from './windows/AboutWindow'
import WorksWindow from './windows/WorksWindow'
import NormiesWindow from './windows/NormiesWindow'
import KhorafunWindow from './windows/KhorafunWindow'
import ContactWindow from './windows/ContactWindow'
import { IconProfile, IconWorks, IconNormies, IconKhorafun, IconContact } from './PixelIcons'

const APPS = [
  { id: 'about',    label: 'PROFILE',  Icon: IconProfile,  Component: AboutWindow   },
  { id: 'works',    label: 'WORKS',    Icon: IconWorks,    Component: WorksWindow   },
  { id: 'normies',  label: 'NORMIES',  Icon: IconNormies,  Component: NormiesWindow },
  { id: 'khorafun', label: 'KHORAFUN', Icon: IconKhorafun, Component: KhorafunWindow},
  { id: 'contact',  label: 'CONTACT',  Icon: IconContact,  Component: ContactWindow },
]

export default function MobileLayout() {
  const [activeApp, setActiveApp] = useState<string | null>(null)
  const [time, setTime] = useState('')
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      setDark(false)
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const current = APPS.find(a => a.id === activeApp)

  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#e3e5e4',
      overflow: 'hidden',
      fontFamily: "'Press Start 2P', monospace",
    }}>

      {/* ── Status bar ─────────────────────────────────── */}
      <div style={{
        background: '#48494b',
        height: 32,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        borderBottom: '2px solid #000',
      }}>
        {activeApp ? (
          <button
            onClick={() => setActiveApp(null)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 7, color: '#e3e5e4', padding: 0,
            }}
          >
            ◀ HOME
          </button>
        ) : (
          <span style={{ fontSize: 8, color: '#e3e5e4', letterSpacing: 2 }}>K4NCUN0</span>
        )}
        {activeApp && (
          <span style={{ fontSize: 7, color: '#c8cac9', letterSpacing: 1 }}>
            {current?.label}
          </span>
        )}
        <span style={{ fontSize: 8, color: '#e3e5e4', letterSpacing: 1 }}>{time}</span>
      </div>

      {/* ── Content ────────────────────────────────────── */}
      {activeApp && current ? (

        /* Open app: full-screen */
        <div style={{ flex: 1, overflow: 'auto' }}>
          <current.Component />
        </div>

      ) : (

        /* Home screen */
        <div className="desktop-bg" style={{ flex: 1, overflow: 'auto' }}>

          {/* Hero strip */}
          <div style={{
            background: '#48494b',
            padding: '18px 20px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderBottom: '3px solid #000',
          }}>
            {/* Mascot frame */}
            <div style={{
              border: '2px solid #e3e5e4',
              boxShadow: '3px 3px 0 #000',
              flexShrink: 0,
            }}>
              <div style={{
                background: '#e3e5e4', height: 8,
                display: 'flex', alignItems: 'center', paddingLeft: 4, gap: 3,
              }}>
                <div style={{ width: 4, height: 4, background: '#48494b' }} />
                <div style={{ width: 4, height: 4, background: '#48494b' }} />
                <div style={{ width: 4, height: 4, background: '#48494b' }} />
              </div>
              <Image
                src="/8362.png"
                alt="Normie #8362"
                width={68}
                height={68}
                style={{ imageRendering: 'pixelated', display: 'block' }}
                priority
              />
            </div>
            {/* Title */}
            <div>
              <div style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 13, color: '#e3e5e4', lineHeight: 1.8,
              }}>
                NORMIE<br />#8362
              </div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: '#9a9c9b', marginTop: 4 }}>
                @osaykancuno
              </div>
            </div>
          </div>

          {/* App icon grid */}
          <div style={{ padding: '22px 20px 16px' }}>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 7, color: '#9a9c9b', marginBottom: 18, letterSpacing: 2,
            }}>
              APPS
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
            }}>
              {APPS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveApp(id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 8,
                    padding: '8px 4px',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{
                    width: 58, height: 58,
                    background: '#48494b',
                    border: '2px solid #000',
                    boxShadow: '3px 3px 0 #000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#e3e5e4',
                  }}>
                    <Icon size={28} />
                  </div>
                  <span style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 6, color: '#48494b',
                    textAlign: 'center', lineHeight: 1.9,
                  }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Hint */}
          <div style={{
            textAlign: 'center', padding: '4px 0 20px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 6, color: '#c8cac9', lineHeight: 2.4,
          }}>
            TAP AN ICON TO OPEN
          </div>
        </div>
      )}

      {/* ── Bottom dock ────────────────────────────────── */}
      <div style={{
        background: '#48494b',
        borderTop: '2px solid #000',
        boxShadow: '0 -2px 0 #000',
        height: 54,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 28px',
      }}>
        <button
          onClick={toggleTheme}
          title={dark ? 'Light mode' : 'Dark mode'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 15, color: '#e3e5e4',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {dark ? '☀' : '☾'}
        </button>

        <span style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8, color: '#c8cac9', letterSpacing: 2,
        }}>
          K4NCUN0
        </span>

        <a
          href="https://x.com/OsayKancuno"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 20, color: '#e3e5e4', textDecoration: 'none' }}
        >
          𝕏
        </a>
      </div>
    </div>
  )
}
