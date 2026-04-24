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

export default function WorksWindow() {
  return (
    <div className="p-4 h-full overflow-auto" style={{ background: '#e3e5e4' }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#48494b', marginBottom: 4, lineHeight: 2 }}>
        WORKS
      </div>
      <div style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: '#9a9c9b', marginBottom: 20 }}>
        Collections, frameworks &amp; services — by @osaykancuno
      </div>

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

      {/* More works placeholder */}
      <div className="pixel-border mt-4" style={{ background: '#ffffff', opacity: 0.5 }}>
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
