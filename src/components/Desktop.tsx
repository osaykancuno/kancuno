'use client'

import Image from 'next/image'
import DesktopIcon from './DesktopIcon'
import Taskbar from './Taskbar'
import Window from './Window'
import AboutWindow from './windows/AboutWindow'
import WorksWindow from './windows/WorksWindow'
import NormiesWindow from './windows/NormiesWindow'
import KhorafunWindow from './windows/KhorafunWindow'
import ContactWindow from './windows/ContactWindow'
import {
  IconProfile, IconWorks, IconNormies,
  IconKhorafun, IconContact, IconTwitter,
} from './PixelIcons'

const ICONS = [
  { id: 'about'    as const, label: 'PROFILE',   Icon: IconProfile  },
  { id: 'works'    as const, label: 'WORKS',     Icon: IconWorks    },
  { id: 'normies'  as const, label: 'NORMIES',   Icon: IconNormies  },
  { id: 'khorafun' as const, label: 'KHORAFUN',  Icon: IconKhorafun },
  { id: 'contact'  as const, label: 'CONTACT',   Icon: IconContact  },
  { id: 'twitter'  as const, label: 'TWITTER',   Icon: IconTwitter, href: 'https://x.com/OsayKancuno' },
]

export default function Desktop() {
  return (
    <div
      id="desktop-area"
      className="desktop-bg"
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', paddingBottom: 40 }}
    >
      <div className="flex h-full">

        {/* Left: icon grid */}
        <div
          className="flex-shrink-0 p-4 pt-6"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 88px)', gap: 4, alignContent: 'start' }}
        >
          {ICONS.map(icon => (
            <DesktopIcon
              key={icon.id}
              id={icon.id}
              label={icon.label}
              Icon={icon.Icon}
              href={'href' in icon ? icon.href : undefined}
            />
          ))}
        </div>

        {/* Center: mascot */}
        <div className="flex-1 flex items-center justify-center pointer-events-none select-none">
          <div style={{
            border: '3px solid #48494b',
            boxShadow: '6px 6px 0px #48494b',
            display: 'inline-block',
            background: '#e3e5e4',
          }}>
            <div style={{
              background: '#48494b', height: 12,
              display: 'flex', alignItems: 'center', paddingLeft: 6, gap: 4,
            }}>
              <div style={{ width: 6, height: 6, background: '#e3e5e4' }} />
              <div style={{ width: 6, height: 6, background: '#e3e5e4' }} />
              <div style={{ width: 6, height: 6, background: '#e3e5e4' }} />
            </div>
            <Image
              src="/8362.png"
              alt="Normie #8362"
              width={260}
              height={260}
              style={{ imageRendering: 'pixelated', display: 'block' }}
              priority
            />
          </div>
        </div>

        {/* Right: branding */}
        <div className="flex-shrink-0 p-6 pt-8 flex flex-col items-end gap-2" style={{ minWidth: 210 }}>
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 26, color: '#48494b', lineHeight: 1.5,
            textAlign: 'right', textShadow: '4px 4px 0 #c8cac9',
          }}>
            NORMIE<br />#8362
          </div>
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 14, color: '#e3e5e4', background: '#48494b',
            padding: '6px 10px', border: '2px solid #000',
            boxShadow: '3px 3px 0 #000', letterSpacing: 2, marginTop: 6,
          }}>
            K4NCUN0
          </div>
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 7, color: '#c8cac9', textAlign: 'right',
            marginTop: 10, lineHeight: 2.2,
          }}>
            BUILDER<br />NORMIES COMMUNITY<br />BOOA HOLDER
          </div>
          <div className="mt-auto" style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 6, color: '#c8cac9', textAlign: 'right',
            lineHeight: 2.2, paddingBottom: 8,
          }}>
            DOUBLE-CLICK<br />AN ICON TO OPEN
          </div>
        </div>
      </div>

      {/* Static windows */}
      <Window id="about"    title="PROFILE"   width={540} height={320}><AboutWindow /></Window>
      <Window id="works"    title="WORKS"     width={480} height={420}><WorksWindow /></Window>
      <Window id="normies"  title="NORMIES"   width={460} height={480}><NormiesWindow /></Window>
      <Window id="khorafun" title="KHORAFUN"  width={460} height={460}><KhorafunWindow /></Window>
      <Window id="contact"  title="CONTACT"   width={380} height={320}><ContactWindow /></Window>

      <Taskbar />
    </div>
  )
}
