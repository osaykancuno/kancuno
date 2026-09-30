'use client'

import Image from 'next/image'
import DesktopIcon from './DesktopIcon'
import Taskbar from './Taskbar'
import Window from './Window'
import AboutWindow from './windows/AboutWindow'
import WorksWindow from './windows/WorksWindow'
import NormiesWindow from './windows/NormiesWindow'
import ContactWindow from './windows/ContactWindow'
import {
  IconProfile, IconWorks, IconNormies,
  IconContact, IconLine, IconCoffee, IconNeonfaces,
} from './PixelIcons'

const ICONS = [
  { id: 'neonfaces' as const, label: 'NEONFACES', Icon: IconNeonfaces, href: 'https://neonfaces.xyz/' },
  { id: 'about'    as const, label: 'PROFILE',   Icon: IconProfile  },
  { id: 'works'    as const, label: 'WORKS',     Icon: IconWorks    },
  { id: 'normies'  as const, label: 'NORMIES',   Icon: IconNormies  },
  { id: 'contact'  as const, label: 'CONTACT',   Icon: IconContact  },
  { id: 'coffee'   as const, label: '8362 COFFEE',        Icon: IconCoffee, href: 'https://8362coffee.com/' },
  { id: 'line'     as const, label: 'NORMIES YACHT CLUB', Icon: IconLine, href: 'https://normiesyachtclub.com/' },
]

export default function Desktop() {
  return (
    <div
      id="desktop-area"
      className="desktop-bg nf-shell"
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
            border: '3px solid var(--nf-ink)',
            boxShadow: '6px 6px 0px var(--nf-ink)',
            display: 'inline-block',
            background: 'var(--nf-bg)',
          }}>
            <div style={{
              background: 'var(--nf-ink)', height: 12,
              display: 'flex', alignItems: 'center', paddingLeft: 6, gap: 4,
            }}>
              <div style={{ width: 6, height: 6, background: 'var(--nf-bg)' }} />
              <div style={{ width: 6, height: 6, background: 'var(--nf-bg)' }} />
              <div style={{ width: 6, height: 6, background: 'var(--nf-bg)' }} />
            </div>
            <div style={{
              width: 260,
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8, lineHeight: 1.9, color: 'var(--nf-bg)',
              background: 'var(--nf-ink)',
              textAlign: 'center', padding: '10px 12px',
            }}>
              CULTURE BELONGS TO THE<br />PEOPLE WHO CREATE IT
            </div>
            {/* On-chain Normie during the intro, neon face once the mutation settles */}
            <Image
              className="nf-normie-only"
              src="/8362.png"
              alt="Normie #8362"
              width={260}
              height={260}
              style={{ imageRendering: 'pixelated', display: 'block' }}
              priority
            />
            <Image
              className="nf-neon-only"
              src="/neon8362.png"
              alt="Normie #8362 mutated into NEONFACES neon"
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
            fontSize: 26, color: 'var(--nf-ink)', lineHeight: 1.5,
            textAlign: 'right', textShadow: '4px 4px 0 var(--nf-soft)',
          }}>
            <span className="nf-normie-only">NORMIE<br />#8362</span><span className="nf-neon-only">NEONFACER</span>
          </div>
          <a
            href="https://x.com/OsayKancuno"
            target="_blank"
            rel="noopener noreferrer"
            title="@OsayKancuno on X / Twitter"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 14, color: 'var(--nf-bg)', background: 'var(--nf-ink)',
              padding: '6px 10px', border: '2px solid var(--nf-edge)',
              boxShadow: '3px 3px 0 var(--nf-edge)', letterSpacing: 2, marginTop: 6,
              textDecoration: 'none', cursor: 'pointer', display: 'inline-block',
            }}
          >
            K4NCUN0
          </a>
          <a
            href="https://neonfaces.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            title="NEONFACES: neonfaces.xyz"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8, color: 'var(--nf-ink)', textAlign: 'right',
              marginTop: 12, lineHeight: 2, textDecoration: 'none',
            }}
          >
            FOUNDER OF<br />NEONFACES ▶
          </a>
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 7, color: 'var(--nf-mute)', textAlign: 'right',
            marginTop: 6, lineHeight: 2.2,
          }}>
            THE100 MEMBER + HOLDER<br />THE NORMIES
          </div>
          <div className="mt-auto" style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 6, color: 'var(--nf-soft)', textAlign: 'right',
            lineHeight: 2.2, paddingBottom: 8,
          }}>
            DOUBLE-CLICK<br />AN ICON TO OPEN
          </div>
        </div>
      </div>

      {/* Static windows */}
      <Window id="about"    title="PROFILE"   width={540} height={320}><AboutWindow /></Window>
      <Window id="works"    title="WORKS"     width={500} height={520}><WorksWindow /></Window>
      <Window id="normies"  title="NORMIES"   width={460} height={480}><NormiesWindow /></Window>
      <Window id="contact"  title="CONTACT"   width={380} height={320}><ContactWindow /></Window>

      <Taskbar />
    </div>
  )
}
