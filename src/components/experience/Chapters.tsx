import BuildTeaser from '../BuildTeaser'
import Sentences from './Sentences'
import Image from 'next/image'
import {
  BOOA_TOOLS, CHAPTER_LABELS, EXPERIMENTS, EXPERIMENTS_LEAD, EXPERIMENT_SLOTS, LINKS, NORMIE_TOOLS, PROFILE, WORKS,
} from './content'

export type DrawerKey = 'profile' | 'experiments' | 'works' | 'community'

// Chapter indexes, in CHAPTER_LABELS order
export const CH = { intro: 0, profile: 1, experiments: 2, communities: 3, normies: 4, contact: 5 } as const

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

export function HeroChapter({ onGo }: { onGo: (i: number) => void }) {
  const latest = EXPERIMENTS[EXPERIMENTS.length - 1]
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
      <button
        type="button"
        className="k-news k-reveal"
        style={{ ['--d' as string]: '0.6s' }}
        onClick={() => onGo(CH.experiments)}
      >
        <span className="k-news-dot" aria-hidden="true" />
        <span className="k-news-code">New · {latest.code}</span>
        <span className="k-news-name">{latest.name}</span>
        <span className="k-news-go" aria-hidden="true">→</span>
      </button>
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

export function ExperimentsChapter({ onOpen }: ChapterProps) {
  const exp = EXPERIMENTS[0]
  const slots = Array.from({ length: Math.max(EXPERIMENT_SLOTS, EXPERIMENTS.length + 1) }, (_, i) => EXPERIMENTS[i])
  return (
    <div className="k-card">
      <Index n={CH.experiments} />
      <h2 className="k-h2" tabIndex={-1}>The<br />lab.</h2>
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
        <button type="button" className="k-btn k-btn--ghost" onClick={() => onOpen('experiments')}>Lab notes</button>
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

export function CommunitiesChapter({ onOpen }: ChapterProps) {
  const rows = [...WORKS, ...BOOA_TOOLS]
  return (
    <div className="k-card">
      <Index n={CH.communities} />
      <h2 className="k-h2 k-h2--fit" tabIndex={-1}>Community<br />work.</h2>
      <p className="k-body">
        <Sentences text={`Games, tools and video I make as a holder, for the communities I belong to. JPEG Frens, The Normies and BOOA.`} />
      </p>
      <ul className="k-list k-hide-sm">
        {rows.map(w => (
          <li key={w.name}>
            <a href={w.url} target="_blank" rel="noopener noreferrer">
              <span className="k-list-name">{w.name}</span>
              <span className="k-list-type">{w.community} · {w.type}</span>
              <Arrow />
            </a>
          </li>
        ))}
      </ul>
      <div className="k-actions">
        <button type="button" className="k-btn" onClick={() => onOpen('works')}>All community work</button>
      </div>
    </div>
  )
}

export function NormiesChapter({ onOpen }: ChapterProps) {
  return (
    <div className="k-card">
      <Index n={CH.normies} />
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
