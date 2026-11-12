'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  BOOA_NOTE, BOOA_TOOLS, LINKS, MY_NORMIE, NORMIE_TOOLS, NORMIES_WORK_NAMES, ON_THE_WALL, PROFILE, WORKS, type Work,
} from './content'
import type { DrawerKey } from './Chapters'
import Sentences from './Sentences'

const TITLES: Record<DrawerKey, string> = {
  profile: 'Profile',
  works: 'Works',
  community: 'Community',
}

function WorkList({ items }: { items: Work[] }) {
  return (
    <ul className="k-dlist">
      {items.map(w => (
        <li key={w.name}>
          <div className="k-dlist-head">
            <h3>{w.name}</h3>
            <span className="k-dlist-type">{w.type}{w.status ? ` · ${w.status}` : ''}</span>
          </div>
          <p><Sentences text={w.desc} /></p>
          {w.extra ? (
            <ul className="k-dlinks">
              {w.extra.map(x => (
                <li key={x.url}>
                  <a href={x.url} target="_blank" rel="noopener noreferrer" className="k-dlink">{x.label} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
                </li>
              ))}
            </ul>
          ) : (
            <a href={w.url} target="_blank" rel="noopener noreferrer" className="k-dlink">
              {w.cta} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}

function Body({ k }: { k: DrawerKey }) {
  if (k === 'profile') {
    return (
      <>
        <p className="k-dmono">{PROFILE.handle} · {PROFILE.tagline}</p>
        <p className="k-dlead"><Sentences text={PROFILE.bio} /></p>
        <blockquote className="k-dquote">{PROFILE.quote}</blockquote>
        <ul className="k-dtags">{PROFILE.tags.map(t => <li key={t}>{t}</li>)}</ul>
        <h3 className="k-dsection">Founder of</h3>
        <ul className="k-dlinks">
          {PROFILE.founderOf.map(f => (
            <li key={f.label}>
              <a href={f.href} target="_blank" rel="noopener noreferrer" className="k-dlink">{f.label} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
            </li>
          ))}
          <li>
            <a href={LINKS.x} target="_blank" rel="noopener noreferrer" className="k-dlink">Twitter / X <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          </li>
        </ul>
        <h3 className="k-dsection">On the wall</h3>
        <p className="k-dtext"><Sentences text={ON_THE_WALL.text} /></p>
        <a href={ON_THE_WALL.url} target="_blank" rel="noopener noreferrer" className="k-dlink">{ON_THE_WALL.cta} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
      </>
    )
  }
  if (k === 'works') {
    return (
      <>
        <p className="k-dlead">Built for the communities — by {PROFILE.handle}.</p>
        <WorkList items={WORKS} />
        <h3 className="k-dsection">Studio collaboration</h3>
        <p className="k-dtext">{BOOA_NOTE}<br />Tools built for this community:</p>
        <WorkList items={BOOA_TOOLS} />
        <div className="k-dsoon">
          <h3>More on the way</h3>
          <p>New projects in progress — stay tuned.</p>
        </div>
      </>
    )
  }
  return (
    <>
      <a className="k-dfeature" href={LINKS.normifesto} target="_blank" rel="noopener noreferrer">
        <span className="k-dfeature-title">The Normifesto</span>
        <span className="k-dfeature-sub">What The Normies stand for, on-chain and forever.</span>
        <span className="k-dlink">Read it <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></span>
      </a>
      <h3 className="k-dsection">Tools built for this community</h3>
      <WorkList items={NORMIE_TOOLS} />
      <h3 className="k-dsection">Also for The Normies</h3>
      <WorkList items={WORKS.filter(w => NORMIES_WORK_NAMES.includes(w.name))} />
      <div className="k-dnormie">
        <Image src="/8362.png" alt="Normie #8362, on-chain PFP of Osay Kancuno" width={88} height={88} style={{ imageRendering: 'pixelated' }} />
        <div>
          <h3>My Normie</h3>
          <p><Sentences text={MY_NORMIE} /></p>
        </div>
      </div>
    </>
  )
}

export default function Drawer({ open, onClose }: { open: DrawerKey | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const lastKey = useRef<DrawerKey>('works')
  if (open) lastKey.current = open
  const k = lastKey.current

  // React 18 has no `inert` prop: toggle the attribute directly
  useEffect(() => { panelRef.current?.toggleAttribute('inert', !open) }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    panelRef.current?.scrollTo({ top: 0 })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key === 'Tab' && panelRef.current) {
        // Keep focus inside the dialog
        const items = panelRef.current.querySelectorAll<HTMLElement>('a[href], button')
        const first = items[0], last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      // Wait for the page to leave its inert state, then give focus back
      requestAnimationFrame(() => previous?.focus?.({ preventScroll: true }))
    }
  }, [open, onClose])

  return (
    <div className="k-drawer-root" data-open={open ? '' : undefined} aria-hidden={!open}>
      <div className="k-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="k-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="k-drawer-title"
        data-scroll-lock
      >
        <div className="k-drawer-head">
          <h2 id="k-drawer-title">{TITLES[k]}</h2>
          <button ref={closeRef} type="button" className="k-close" onClick={onClose} aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="k-drawer-body">
          <Body k={k} />
        </div>
      </div>
    </div>
  )
}
