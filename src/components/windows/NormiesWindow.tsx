const NORMIE_TOOLS = [
  { name: 'MESSAGE FROM NORMIES', tag: 'Community Wall',  url: 'https://messages-from-normies-production.up.railway.app/',  desc: 'Leave your mark, your message, your Normie.' },
  { name: 'NORMSKY',              tag: 'GIF Generator',   url: 'http://normski-generator.vercel.app',           desc: 'Your Normie with a Banksy-style effect.' },
  { name: 'NORMIEMAP',            tag: '3D Interactive Map', url: 'http://normie-map-production.up.railway.app', desc: 'Place your NFT, listen to music, chat live.' },
  { name: 'SUPER NORMIE',         tag: 'Platformer Game', url: 'http://super-normie-production.up.railway.app', desc: 'On-chain traits become real gameplay abilities.' },
  { name: 'VIDEO NORMIFIER',      tag: 'Video Editor',    url: 'http://video-normifier.vercel.app',             desc: 'Turn your videos (and REC) into pixel art.' },
  { name: 'NORMIE STICKER',       tag: 'AR + Stickers',   url: 'https://normie-sticker.vercel.app',             desc: 'View your Normie in AR, download stickers, share animated GIFs.' },
]

export default function NormiesWindow() {
  return (
    <div className="p-4 h-full overflow-auto" style={{ background: '#e3e5e4' }}>

      {/* Header */}
      <div className="w-full flex items-center justify-center mb-4"
        style={{ background: '#48494b', padding: '16px 8px', border: '2px solid #000' }}>
        <div className="text-center">
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18, color: '#e3e5e4', letterSpacing: 4, lineHeight: 1.5 }}>
            THE NORMIES
          </div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: '#c8cac9', marginTop: 4 }}>
            @normiesART
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="pixel-border p-3 mb-4" style={{ background: '#ffffff' }}>
        <p style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: '#48494b', lineHeight: 1.5 }}>
          The first fully customizable on-chain ERC-1155 NFT.
          Each Normie is a 40×40 monochrome bitmap stored entirely
          on the Ethereum blockchain — 64 traits, infinitely customizable,
          100% community-driven.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'STANDARD', value: 'ERC-1155' },
          { label: 'SIZE',     value: '40×40 PX' },
          { label: 'TRAITS',   value: '64+' },
          { label: 'CHAIN',    value: 'ETHEREUM' },
        ].map(s => (
          <div key={s.label} className="pixel-border p-2 text-center" style={{ background: '#ffffff' }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#9a9c9b', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#48494b' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Official links */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: 'WEBSITE', href: 'https://www.normies.app/' },
          { label: 'OPENSEA', href: 'https://opensea.io/collection/thenormiesnft' },
          { label: 'TWITTER', href: 'https://twitter.com/normiesART' },
          { label: 'RARITY',  href: 'https://rarity.normies.art/' },
        ].map(l => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
            className="pixel-btn" style={{ fontSize: 7, textDecoration: 'none' }}>
            ▶ {l.label}
          </a>
        ))}
      </div>

      <div style={{ borderTop: '2px solid #48494b', marginBottom: 16 }} />

      {/* Tools */}
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#48494b', marginBottom: 12, lineHeight: 2 }}>
        TOOLS BUILT FOR THIS COMMUNITY
      </div>

      <div className="flex flex-col gap-3">
        {NORMIE_TOOLS.map(tool => (
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

      <div className="mt-4 pixel-border p-3" style={{ background: '#48494b' }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#e3e5e4', marginBottom: 6 }}>MY NORMIE</div>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: '#c8cac9', lineHeight: 1.4 }}>
          Normie #8362 — my on-chain PFP. Part of the community since day 1.
        </div>
      </div>
    </div>
  )
}
