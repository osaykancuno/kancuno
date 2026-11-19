import BuildTeaser from '../BuildTeaser'
import Sentences from './Sentences'
import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CARD_WORKS, CHAPTER_LABELS, COMMUNITIES, COMMUNITY_WORK_COUNT, EXPERIMENTS, EXPERIMENTS_LEAD, EXPERIMENT_SLOTS, LINKS, PROFILE,
  type CommunityId,
} from './content'

export type DrawerKey = 'profile' | 'experiments' | 'works'

// Chapter indexes, in CHAPTER_LABELS order
export const CH = { intro: 0, profile: 1, experiments: 2, communities: 3, contact: 4 } as const

interface ChapterProps {
  // section: an id inside the drawer to scroll to (a community)
  onOpen: (key: DrawerKey, section?: string) => void
}

const Arrow = () => (
  <>
    <span className="k-arrow" aria-hidden="true">↗</span>
    <span className="sr-only"> (opens in a new tab)</span>
  </>
)

function Index({ n }: { n: number }) {
  return (
    <p className="k-index">
      <span className="k-index-dot" aria-hidden="true" />
      {String(n + 1).padStart(2, '0')} — {CHAPTER_LABELS[n]}
    </p>
  )
}

export function HeroChapter() {
  return (
    <div className="k-hero">
      <p className="k-eyebrow k-reveal" style={{ ['--d' as string]: '0.05s' }}>
        Artist &amp; builder on-chain
      </p>
      <h2 className="k-title" tabIndex={-1}>
        <span className="k-line"><span style={{ ['--d' as string]: '0.1s' }}>Osay</span></span>
        <span className="k-line"><span style={{ ['--d' as string]: '0.2s' }}>Kancuno</span></span>
      </h2>
      <div className="k-hero-meta k-reveal" style={{ ['--d' as string]: '0.45s' }}>
        {/* The handle and THE K.LAB stacked as a pair, as tall as the teaser beside them */}
        <div className="k-hero-ctas">
          <a className="k-handle" href={LINKS.x} target="_blank" rel="noopener noreferrer">
            K4NCUN0 <Arrow />
          </a>
          <Link className="k-handle k-neon k-hero-lab" href="/klab">
            THE K.LAB <span className="k-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="k-teaser">
          <BuildTeaser />
        </div>
      </div>
    </div>
  )
}

export function ProfileChapter({ onOpen }: ChapterProps) {
  return (
    <div className="k-card">
      <Index n={CH.profile} />
      <h2 className="k-h2" tabIndex={-1}>Artist &amp;<br />builder.</h2>
      <p className="k-mono-line k-tall-only">{PROFILE.handle} · {PROFILE.tagline}</p>
      <p className="k-body"><Sentences text={PROFILE.bio} /></p>
      <ul className="k-founder">
        {PROFILE.ventures.map(v => (
          <li key={v.label} className="k-venture">
            <span className="k-label">{v.role} of</span>
            <a href={v.href} target="_blank" rel="noopener noreferrer" className="k-link">
              {v.label} <Arrow />
            </a>
          </li>
        ))}
      </ul>
      <div className="k-actions">
        <a className="k-btn" href={LINKS.x} target="_blank" rel="noopener noreferrer">Twitter / X <Arrow /></a>
        <button type="button" className="k-btn k-btn--ghost" onClick={() => onOpen('profile')}>Full profile</button>
      </div>
    </div>
  )
}

export function ExperimentsChapter({ onOpen }: ChapterProps) {
  const exp = EXPERIMENTS[0]
  const slots = Array.from({ length: Math.max(EXPERIMENT_SLOTS, EXPERIMENTS.length + 1) }, (_, i) => EXPERIMENTS[i])
  return (
    <div className="k-card">
      <Index n={CH.experiments} />
      <h2 className="k-h2" tabIndex={-1}>Side<br />quests.</h2>
      <p className="k-body"><Sentences text={EXPERIMENTS_LEAD} /></p>
      <a className="k-exp" href={exp.url} target="_blank" rel="noopener noreferrer">
        {/* Wordmark banner on tall screens; the plain name takes over when space is short */}
        <span className="k-exp-media">
          <Image src={exp.image.src} alt="" width={exp.image.width} height={exp.image.height} sizes="520px" />
        </span>
        <span className="k-exp-meta">
          <span className="k-exp-live" aria-hidden="true" />
          {exp.code} · {exp.kind} · {exp.status}
        </span>
        <span className="k-exp-name">{exp.name}</span>
        <span className="k-exp-desc">{exp.tagline} <span className="k-hide-sm">{exp.desc.split('. ')[0]}.</span></span>
        <span className="k-exp-cta">{exp.cta} <Arrow /></span>
      </a>
      <div className="k-actions k-exp-foot">
        <button type="button" className="k-btn k-btn--ghost" onClick={() => onOpen('experiments')}>Quest log</button>
        <ol className="k-track k-hide-sm" aria-label="The series">
          {slots.map((e, i) => (
            <li key={i} data-live={e ? '' : undefined}>
              <span>{String(i + 1).padStart(3, '0')}</span>
              {e ? e.name : 'Soon'}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export function CommunitiesChapter({ onOpen, onTab }: ChapterProps & { onTab: (id: CommunityId) => void }) {
  const [tab, setTabState] = useState<CommunityId>(COMMUNITIES[0].id)
  const setTab = (id: CommunityId) => { setTabState(id); onTab(id) }
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const shown = CARD_WORKS

  // Tabs pattern: arrows move between tabs, Home/End jump to the ends
  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const n = COMMUNITIES.length
    const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n
      : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (to < 0) return
    e.preventDefault()
    e.stopPropagation()
    setTab(COMMUNITIES[to].id)
    tabRefs.current[to]?.focus()
  }

  return (
    <div className="k-card">
      <Index n={CH.communities} />
      <h2 className="k-h2 k-h2--fit" tabIndex={-1}>Community<br />work.</h2>
      <p className="k-body k-hide-sm">
        <Sentences text={`${COMMUNITY_WORK_COUNT} works I made as a holder, for the communities I belong to.`} />
      </p>
      <div className="k-tabs" role="tablist" aria-label="Communities">
        {COMMUNITIES.map((x, i) => (
          <button
            key={x.id}
            ref={el => { tabRefs.current[i] = el }}
            type="button"
            role="tab"
            id={`k-tab-${x.id}`}
            aria-selected={x.id === tab}
            aria-controls={`k-tabpanel-${x.id}`}
            tabIndex={x.id === tab ? 0 : -1}
            className="k-tab"
            onClick={() => setTab(x.id)}
            onKeyDown={e => onTabKey(e, i)}
          >
            {x.name}
            <span className="k-tab-count" aria-hidden="true">{x.works.length}</span>
            <span className="sr-only">, {x.works.length} works</span>
          </button>
        ))}
      </div>
      {/* All panels share one grid cell, so the card keeps the height of the tallest
          and the heading never jumps when the tab changes */}
      <div className="k-tabpanels">
        {COMMUNITIES.map(x => {
          const on = x.id === tab
          return (
            <div
              key={x.id}
              className="k-tabpanel"
              role="tabpanel"
              id={`k-tabpanel-${x.id}`}
              aria-labelledby={`k-tab-${x.id}`}
              data-inactive={on ? undefined : ''}
              {...(on ? {} : ({ inert: true, 'aria-hidden': true } as object))}
            >
              <p className="k-tab-role">{x.role}</p>
              <ul className="k-list k-list--tab k-hide-sm">
                {x.works.slice(0, shown).map(w => (
                  <li key={w.name}>
                    <a href={w.url} target="_blank" rel="noopener noreferrer">
                      <span className="k-list-name">{w.name}</span>
                      <span className="k-list-type">{w.type}</span>
                      <Arrow />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="k-actions">
                <button type="button" className="k-btn" onClick={() => onOpen('works', x.id)}>
                  {`All ${x.works.length} works`}
                </button>
                {x.link && (
                  <a className="k-btn k-btn--ghost" href={x.link.url} target="_blank" rel="noopener noreferrer">
                    {x.link.label} <Arrow />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ContactChapter() {
  return (
    <div className="k-card">
      <Index n={CH.contact} />
      <h2 className="k-h2" tabIndex={-1}>Get in<br />touch.</h2>
      <div className="k-contacts">
        <a className="k-contact" href={LINKS.x} target="_blank" rel="noopener noreferrer">
          <span className="k-contact-name">Twitter / X</span>
          <span className="k-contact-sub">@OsayKancuno — follow me</span>
          <Arrow />
        </a>
        <a className="k-contact" href={LINKS.telegram} target="_blank" rel="noopener noreferrer">
          <span className="k-contact-name">Telegram</span>
          <span className="k-contact-sub">@kancuno — message me</span>
          <Arrow />
        </a>
      </div>
      <p className="k-foot" suppressHydrationWarning>© {new Date().getFullYear()} Osay Kancuno · K4NCUN0</p>
    </div>
  )
}
