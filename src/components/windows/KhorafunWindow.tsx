const BOOA_TOOLS = [
  { name: 'MOLTBOOA LAB',  tag: 'Agent Simulator', url: 'http://moltbooa-lab.vercel.app',       desc: 'Your agent has a life now: simulate, chat, battle, and export your BOOA to production.' },
  { name: 'SKILL SYNERGY', tag: 'Agent Matcher',   url: 'http://booa-skill-synergy.vercel.app', desc: 'Find the right match: the complementary skills of on-chain AI agents.' },
]

export default function KhorafunWindow() {
  return (
    <div className="p-4 h-full overflow-auto" style={{ background: 'var(--nf-bg)' }}>

      {/* Header */}
      <div className="w-full flex items-center justify-center mb-4"
        style={{ background: 'var(--nf-ink)', padding: '16px 8px', border: '2px solid var(--nf-edge)' }}>
        <div className="text-center">
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: 'var(--nf-bg)', letterSpacing: 3, lineHeight: 1.5 }}>
            KHÔRA
          </div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: 'var(--nf-soft)', marginTop: 4 }}>
            @khorafun — khora.fun
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="pixel-border p-3 mb-4" style={{ background: 'var(--nf-card)' }}>
        <p style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: 'var(--nf-text)', lineHeight: 1.5 }}>
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
          <div key={s.label} className="pixel-border p-2 text-center" style={{ background: 'var(--nf-card)' }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: 'var(--nf-mute)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: 'var(--nf-ink)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Official links — MINT removed */}
      <div className="flex flex-wrap gap-2 mb-6">
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

      <div style={{ borderTop: '2px solid var(--nf-ink)', marginBottom: 16 }} />

      {/* Tools */}
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: 'var(--nf-ink)', marginBottom: 12, lineHeight: 2 }}>
        TOOLS BUILT FOR THIS COMMUNITY
      </div>

      <div className="flex flex-col gap-3">
        {BOOA_TOOLS.map(tool => (
          <div key={tool.name} className="pixel-border p-3" style={{ background: 'var(--nf-card)' }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: 'var(--nf-ink)' }}>
                {tool.name}
              </span>
              <span style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                padding: '2px 4px', background: 'var(--nf-ink)', color: 'var(--nf-card)',
                border: '1px solid var(--nf-edge)', flexShrink: 0,
              }}>
                {tool.tag}
              </span>
            </div>
            <p style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: 'var(--nf-text)', marginBottom: 8, lineHeight: 1.3 }}>
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
  )
}
