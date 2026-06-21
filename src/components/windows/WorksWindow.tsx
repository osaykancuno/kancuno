interface WorkItem {
  name: string
  type: 'NFT COLLECTION' | 'TRIBUTE' | 'SERVICE' | 'FRAMEWORK'
  desc: string
  url: string
  status: 'LIVE' | 'WIP' | 'SOON'
  cta: string
}

const WORKS: WorkItem[] = [
  {
    name: 'WE ARE ALL NORMIES',
    type: 'TRIBUTE',
    desc: 'A tribute NFT collection celebrating The Normies community. A collaborative 69x69 canvas.',
    url: 'https://opensea.io/collection/we-are-all-normies',
    status: 'LIVE',
    cta: 'VIEW ON OPENSEA',
  },
  {
    name: 'THE FRAMEWORK LIBRARY',
    type: 'FRAMEWORK',
    desc: 'A free Notion framework helping Web3 builders avoid common mistakes — built from real experience in the field.',
    url: 'https://kancuno.notion.site/THE-FRAMEWORK-LIBRARY-2e54fed9de0b80dcb5e3df60fb00432c',
    status: 'LIVE',
    cta: 'OPEN FRAMEWORK',
  },
  {
    name: 'VIRALLIA',
    type: 'SERVICE',
    desc: 'AI consultancy for professional firms or small and medium-sized enterprises — Italian market.',
    url: 'https://virallia.com/',
    status: 'LIVE',
    cta: 'VISIT SITE',
  },
]

const TYPE_BG: Record<WorkItem['type'], string> = {
  'NFT COLLECTION': '#48494b',
  'TRIBUTE':        '#48494b',
  'SERVICE':        '#48494b',
  'FRAMEWORK':      '#48494b',
}

const BOOA_TOOLS = [
  { name: 'MOLTBOOA LAB',  tag: 'Agent Simulator', url: 'http://moltbooa-lab.vercel.app',       desc: 'Your agent has a life now: simulate, chat, battle, and export your BOOA to production.' },
  { name: 'SKILL SYNERGY', tag: 'Agent Matcher',   url: 'http://booa-skill-synergy.vercel.app', desc: 'Find the right match: the complementary skills of on-chain AI agents.' },
]

export default function WorksWindow() {
  return (
    <div className="p-4 h-full overflow-auto" style={{ background: '#e3e5e4' }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#48494b', marginBottom: 4, lineHeight: 2 }}>
        WORKS
      </div>
      <div style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: '#9a9c9b', marginBottom: 20 }}>
        Collections, frameworks &amp; services — by @osaykancuno
      </div>

      {/* Personal works */}
      <div className="flex flex-col gap-4">
        {WORKS.map(work => (
          <div key={work.name} className="pixel-border" style={{ background: '#ffffff' }}>
            {/* Header strip */}
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ background: TYPE_BG[work.type], borderBottom: '2px solid #000' }}
            >
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#e3e5e4' }}>
                {work.name}
              </span>
              <div className="flex gap-1">
                <span style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                  padding: '2px 5px', background: '#e3e5e4', color: '#48494b', border: '1px solid #000',
                }}>
                  {work.type}
                </span>
                <span style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                  padding: '2px 5px', background: '#000', color: '#e3e5e4',
                }}>
                  {work.status}
                </span>
              </div>
            </div>

            <div className="p-3">
              <p style={{ fontFamily: "'VT323', monospace", fontSize: 17, color: '#48494b', lineHeight: 1.4, marginBottom: 10 }}>
                {work.desc}
              </p>
              <a
                href={work.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn inline-block"
                style={{ fontSize: 7, textDecoration: 'none' }}
              >
                ▶ {work.cta}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ─── KHÔRA section — distinct from personal works ─── */}
      <div className="mt-8" style={{ borderTop: '3px double #48494b', paddingTop: 20 }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#9a9c9b', marginBottom: 4, letterSpacing: 2 }}>
          / STUDIO COLLABORATION
        </div>

        {/* Khôra header banner */}
        <div className="w-full flex items-center justify-center mb-4 mt-2"
          style={{ background: '#48494b', padding: '14px 8px', border: '2px solid #000' }}>
          <div className="text-center">
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: '#e3e5e4', letterSpacing: 3, lineHeight: 1.5 }}>
              KHÔRA
            </div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: '#c8cac9', marginTop: 4 }}>
              @khorafun — khora.fun
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pixel-border p-3 mb-4" style={{ background: '#ffffff' }}>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: 17, color: '#48494b', lineHeight: 1.5 }}>
            Khôra is an open-source studio building tools for autonomous agents,
            generative NFTs, and on-chain games.
            <br /><br />
            <strong>BOOA</strong> (Born On-chain Owned Agents) is their flagship collection:
            3,333 AI agent identities fully stored on Shape Network as 64×64 pixel art.
            Each agent has unique Skill, Domain, Meme Core and more — all on-chain.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'SUPPLY',  value: '3,333' },
            { label: 'SIZE',    value: '64×64 PX' },
            { label: 'SKILLS',  value: '73 VARS' },
            { label: 'CHAIN',   value: 'SHAPE L2' },
          ].map(s => (
            <div key={s.label} className="pixel-border p-2 text-center" style={{ background: '#ffffff' }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#9a9c9b', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#48494b' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Official links */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { label: 'WEBSITE', href: 'https://www.khora.fun/booa' },
            { label: 'OPENSEA', href: 'https://opensea.io/collection/booa' },
            { label: 'TWITTER', href: 'https://twitter.com/khorafun' },
          ].map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
              className="pixel-btn" style={{ fontSize: 7, textDecoration: 'none' }}>
              ▶ {l.label}
            </a>
          ))}
        </div>

        {/* BOOA tools built by Kancuno */}
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#48494b', marginBottom: 12, lineHeight: 2 }}>
          TOOLS BUILT FOR THIS COMMUNITY
        </div>

        <div className="flex flex-col gap-3">
          {BOOA_TOOLS.map(tool => (
            <div key={tool.name} className="pixel-border p-3" style={{ background: '#ffffff' }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#48494b' }}>
                  {tool.name}
                </span>
                <span style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                  padding: '2px 4px', background: '#48494b', color: '#ffffff',
                  border: '1px solid #000', flexShrink: 0,
                }}>
                  {tool.tag}
                </span>
              </div>
              <p style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: '#48494b', marginBottom: 8, lineHeight: 1.3 }}>
                {tool.desc}
              </p>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn inline-block"
                style={{ fontSize: 7, textDecoration: 'none' }}
              >
                ▶ OPEN
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* More works placeholder */}
      <div className="pixel-border mt-6" style={{ background: '#ffffff', opacity: 0.5 }}>
        <div
          className="px-3 py-2"
          style={{ background: '#48494b', borderBottom: '2px solid #000' }}
        >
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#e3e5e4' }}>
            MORE ON THE WAY
          </span>
        </div>
        <div className="p-3">
          <p style={{ fontFamily: "'VT323', monospace", fontSize: 17, color: '#48494b', lineHeight: 1.4 }}>
            New projects in progress — stay tuned.
          </p>
        </div>
      </div>
    </div>
  )
}
