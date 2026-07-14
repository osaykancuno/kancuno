const NORMIE_TOOLS = [
  { name: 'NORMIES UNIVERSITY',   tag: 'Agent Academy',     url: 'https://normie-university.vercel.app/',         desc: 'Enroll your Normie as a learning agent: buy skill modules in USDC and earn on-chain soulbound credentials that build a composable reputation other protocols can read.' },
  { name: 'AIR NORMIES',          tag: 'Gesture Suite',     url: 'https://air-normies.netlify.app/',              desc: 'Touchless app suite: point and pinch with your fingers to control Normies tools — no keyboard, no mouse.' },
  { name: 'THE NORMIES CITY',     tag: '3D Cityscape',      url: 'https://the-normies-city.vercel.app/',          desc: 'Every Normie is a building in a 3D city — orbit from above, fly through, or drop into street view and walk.' },
  { name: 'NORMIE STICKER',       tag: 'AR Studio',         url: 'https://normie-sticker.vercel.app',             desc: 'See your Normie in AR through your camera, pose it in the real world and export stickers or animated GIFs to share.' },
  { name: 'VIDEO NORMIFIER',      tag: 'Video → Pixel',     url: 'http://video-normifier.vercel.app',             desc: 'Upload a clip or record from your camera and turn it into pixel art. Pick aspect ratio, color mode, resolution and frame rate, then download.' },
  { name: 'SUPER NORMIE',         tag: 'Platformer',        url: 'http://super-normie-production.up.railway.app', desc: 'Run, jump and stomp enemies in a community platformer. Daily challenges, multiplayer mode and a global leaderboard.' },
  { name: 'NORMIEMAP',            tag: '3D Globe + Chat',   url: 'http://normie-map-production.up.railway.app',   desc: 'Pin your Normie on a 3D globe as resident or traveler, link your X, chat in Normchat and watch the worldwide holder heatmap.' },
  { name: 'NORMSKY',              tag: 'Street Art Frames', url: 'http://normski-generator.vercel.app',           desc: 'Type a Token ID and frame your Normie on a concrete, brick or plaster wall. Export still images or animated GIFs at any resolution.' },
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
          10,000 fully on-chain, CC0 generative faces — humans, cats,
          agents and aliens. Each Normie is a 40×40 monochrome bitmap
          (1,600 pixels) packed into just 200 bytes of contract storage
          on Ethereum. Nothing lives on a server: burn the website and
          the art is still there.
          <br /><br />
          7 guaranteed traits + 3 optional rare ones per Normie.
          Supply is <strong>deflationary</strong> — every burn is permanent,
          and burned Normies are what mint the Yacht Club fleet.
          CC0 means anyone can build on them. That is what this desktop is.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'STANDARD', value: 'ERC-721' },
          { label: 'LICENSE',  value: 'CC0'      },
          { label: 'MINTED',   value: '10,000'   },
          { label: 'SUPPLY',   value: '7,359 *'  },
          { label: 'SIZE',     value: '40×40 PX' },
          { label: 'CHAIN',    value: 'ETHEREUM' },
        ].map(s => (
          <div key={s.label} className="pixel-border p-2 text-center" style={{ background: '#ffffff' }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#9a9c9b', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#48494b' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Supply footnote */}
      <div className="mb-4" style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: '#9a9c9b', lineHeight: 1.4 }}>
        * Supply shrinks with every burn — check OpenSea for the live count.
      </div>

      {/* Official links */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: 'WEBSITE', href: 'https://normies.art' },
          { label: 'OPENSEA', href: 'https://opensea.io/collection/normies' },
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
