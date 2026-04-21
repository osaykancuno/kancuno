'use client'

import { useState } from 'react'
import Image from 'next/image'
import AboutWindow from './windows/AboutWindow'
import WorksWindow from './windows/WorksWindow'
import NormiesWindow from './windows/NormiesWindow'
import KhorafunWindow from './windows/KhorafunWindow'
import ContactWindow from './windows/ContactWindow'
import { IconProfile, IconWorks, IconNormies, IconKhorafun, IconContact } from './PixelIcons'

const SECTIONS = [
  { id: 'about',    label: 'PROFILE',  Icon: IconProfile,  Component: AboutWindow },
  { id: 'works',    label: 'WORKS',    Icon: IconWorks,    Component: WorksWindow },
  { id: 'normies',  label: 'NORMIES',  Icon: IconNormies,  Component: NormiesWindow },
  { id: 'khorafun', label: 'KHORAFUN', Icon: IconKhorafun, Component: KhorafunWindow },
  { id: 'contact',  label: 'CONTACT',  Icon: IconContact,  Component: ContactWindow },
]

export default function MobileLayout() {
  const [open, setOpen] = useState<string | null>('about')

  return (
    <div className="desktop-bg min-h-screen" style={{ fontFamily: "'Press Start 2P', monospace" }}>
      {/* Mobile header */}
      <div
        style={{
          background: '#48494b',
          padding: '16px',
          borderBottom: '2px solid #000',
          textAlign: 'center',
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Image
            src="/8362.png"
            alt="Normie #8362"
            width={48}
            height={48}
            style={{ imageRendering: 'pixelated' }}
          />
          <div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#e3e5e4', lineHeight: 1.5 }}>
              NORMIE #8362
            </div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: '#9a9c9b' }}>
              @osaykancuno
            </div>
          </div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#9a9c9b', lineHeight: 2 }}>
          kancuno.com
        </div>
      </div>

      {/* Accordion sections */}
      <div className="p-3 flex flex-col gap-2">
        {SECTIONS.map(({ id, label, Icon, Component }) => (
          <div key={id} className="pixel-border" style={{ background: '#ffffff' }}>
            {/* Section header */}
            <button
              className="w-full flex items-center justify-between px-3 py-3"
              style={{
                background: open === id ? '#48494b' : '#e3e5e4',
                color: open === id ? '#ffffff' : '#48494b',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                cursor: 'pointer',
                border: 'none',
                width: '100%',
                textAlign: 'left',
              }}
              onClick={() => setOpen(open === id ? null : id)}
            >
              <span className="flex items-center gap-2">
                <Icon size={20} />
                {label}
              </span>
              <span style={{ fontSize: 10 }}>{open === id ? '▲' : '▼'}</span>
            </button>

            {/* Section content */}
            {open === id && (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                <Component />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile footer */}
      <div
        className="flex items-center justify-center gap-4 p-4"
        style={{ borderTop: '2px solid #48494b', marginTop: 8 }}
      >
        <a
          href="https://x.com/OsayKancuno"
          target="_blank"
          rel="noopener noreferrer"
          className="pixel-btn"
          style={{ fontSize: 8, textDecoration: 'none' }}
        >
          𝕏 TWITTER
        </a>
        <a
          href="https://twitter.com/normiesART"
          target="_blank"
          rel="noopener noreferrer"
          className="pixel-btn"
          style={{ fontSize: 8, textDecoration: 'none' }}
        >
          NORMIES
        </a>
      </div>
    </div>
  )
}
