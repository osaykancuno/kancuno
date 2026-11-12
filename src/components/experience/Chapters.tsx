import BuildTeaser from '../BuildTeaser'
import Sentences from './Sentences'
import {
  BOOA_TOOLS, CHAPTER_LABELS, LINKS, NORMIE_TOOLS, PROFILE, WORKS,
} from './content'

export type DrawerKey = 'profile' | 'works' | 'community'

interface ChapterProps {
  onOpen: (key: DrawerKey) => void
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
        <a className="k-handle" href={LINKS.x} target="_blank" rel="noopener noreferrer">
          K4NCUN0 <Arrow />
        </a>
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
      <Index n={1} />
      <h2 className="k-h2" tabIndex={-1}>Artist &amp;<br />builder.</h2>
      <p className="k-mono-line k-tall-only">{PROFILE.handle} · {PROFILE.tagline}</p>
      <p className="k-body"><Sentences text={PROFILE.bio} /></p>
      <blockquote className="k-quote k-hide-sm k-mid-only">{PROFILE.quote}</blockquote>
      <div className="k-founder">
        <span className="k-label">Founder of</span>
        {PROFILE.founderOf.map(f => (
          <a key={f.label} href={f.href} target="_blank" rel="noopener noreferrer" className="k-link">
            {f.label} <Arrow />
          </a>
        ))}
      </div>
      <div className="k-actions">
        <a className="k-btn" href={LINKS.x} target="_blank" rel="noopener noreferrer">Twitter / X <Arrow /></a>
        <button type="button" className="k-btn k-btn--ghost" onClick={() => onOpen('profile')}>Full profile</button>
      </div>
    </div>
  )
}

export function WorksChapter({ onOpen }: ChapterProps) {
  const rows = [...WORKS, ...BOOA_TOOLS.map(t => ({ ...t, type: `BOOA · ${t.type}` }))]
  return (
    <div className="k-card">
      <Index n={2} />
      <h2 className="k-h2" tabIndex={-1}>Selected<br />works.</h2>
      <p className="k-body">
        Games, tools, frameworks and video, by {PROFILE.handle}.<br />
        More on the way: new projects in progress.
      </p>
      <ul className="k-list k-hide-sm">
        {rows.map(w => (
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
        <button type="button" className="k-btn" onClick={() => onOpen('works')}>All works &amp; details</button>
      </div>
    </div>
  )
}

export function CommunityChapter({ onOpen }: ChapterProps) {
  return (
    <div className="k-card">
      <Index n={3} />
      <h2 className="k-h2 k-h2--fit" tabIndex={-1}>THE100.<br />The&nbsp;Normies.</h2>
      <p className="k-body">
        Member and holder of THE100 in The Normies, part of the community since day 1,
        with Normie #8362 as on-chain PFP.<br />
        I build free tools for the community.
      </p>
      <p className="k-stat">
        <strong>{NORMIE_TOOLS.length}</strong>
        <span>community tools<br />built so far</span>
      </p>
      <div className="k-actions">
        <button type="button" className="k-btn" onClick={() => onOpen('community')}>Explore the tools</button>
        <a className="k-btn k-btn--ghost" href={LINKS.normifesto} target="_blank" rel="noopener noreferrer">
          The Normifesto <Arrow />
        </a>
      </div>
    </div>
  )
}

export function ContactChapter() {
  return (
    <div className="k-card">
      <Index n={4} />
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
