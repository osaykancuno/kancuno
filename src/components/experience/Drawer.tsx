'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  COMMUNITIES, EXPERIMENTS, LINKS, MY_NORMIE, ON_THE_WALL, OWN_PROJECTS, PROFILE, type Work,
} from './content'
import type { DrawerKey } from './Chapters'
import Sentences from './Sentences'

const TITLES: Record<DrawerKey, string> = {
  profile: 'Profile',
  experiments: 'The lab',
  works: 'Community work',
}

const NewTab = () => <><span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></>

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
        <h3 className="k-dsection">Own projects</h3>
        <WorkList items={OWN_PROJECTS} />
        <h3 className="k-dsection">On the wall</h3>
        <p className="k-dtext"><Sentences text={ON_THE_WALL.text} /></p>
        <a href={ON_THE_WALL.url} target="_blank" rel="noopener noreferrer" className="k-dlink">{ON_THE_WALL.cta} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
      </>
    )
  }
  if (k === 'experiments') {
    return (
      <>
        {EXPERIMENTS.map(e => (
          <article key={e.code} className="k-dexp">
            <a href={e.url} target="_blank" rel="noopener noreferrer" className="k-dexp-media">
              <Image src={e.image.src} alt={e.image.alt} width={e.image.width} height={e.image.height} sizes="(max-width: 767px) 90vw, 520px" />
            </a>
            <p className="k-dmono">{e.code} · {e.kind} · {e.status}</p>
            <h3 className="k-dexp-name">{e.name}</h3>
            <p className="k-dtext"><Sentences text={`${e.tagline} ${e.desc}`} /></p>
            <ul className="k-dfeatures">
              {e.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <a href={e.url} target="_blank" rel="noopener noreferrer" className="k-dlink">{e.cta} <NewTab /></a>
          </article>
        ))}
        <div className="k-dsoon">
          <h3>Next experiments</h3>
          <p>On-chain and off-chain.<br />In the works, stay tuned on X.</p>
          <a href={LINKS.x} target="_blank" rel="noopener noreferrer" className="k-dlink">Follow @OsayKancuno <NewTab /></a>
        </div>
      </>
    )
  }
  return (
    <>
      <p className="k-dlead"><Sentences text="Work I make as a holder, for the communities I belong to." /></p>
      <nav className="k-djump" aria-label="Communities">
        {COMMUNITIES.map(c => (
          <a key={c.id} href={`#d-${c.id}`}>{c.name} <span>{c.works.length}</span></a>
        ))}
      </nav>
      {COMMUNITIES.map(c => (
        <section key={c.id} id={`d-${c.id}`} className="k-dcommunity" aria-labelledby={`d-${c.id}-title`}>
          <h3 id={`d-${c.id}-title`} className="k-dcommunity-title">{c.name}</h3>
          <p className="k-dtext"><Sentences text={c.role} /></p>
          {c.id === 'normies' && (
            <div className="k-dnormie">
              <Image src="/8362.png" alt="Normie #8362, on-chain PFP of Osay Kancuno" width={88} height={88} style={{ imageRendering: 'pixelated' }} />
              <div>
                <h4>My Normie</h4>
                <p><Sentences text={MY_NORMIE} /></p>
              </div>
            </div>
          )}
          {c.link && (
            <a className="k-dfeature" href={c.link.url} target="_blank" rel="noopener noreferrer">
              <span className="k-dfeature-title">{c.link.label}</span>
              <span className="k-dfeature-sub">What The Normies stand for, on-chain and forever.</span>
              <span className="k-dlink">Read it <NewTab /></span>
            </a>
          )}
          <WorkList items={c.works} />
        </section>
      ))}
    </>
  )
}

export default function Drawer({ open, section, onClose }: { open: DrawerKey | null; section?: string; onClose: () => void }) {
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
    const target = section ? panelRef.current?.querySelector<HTMLElement>(`#d-${section}`) : null
    if (target && panelRef.current) panelRef.current.scrollTo({ top: target.offsetTop - 84 })
    else panelRef.current?.scrollTo({ top: 0 })
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
  }, [open, section, onClose])

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
