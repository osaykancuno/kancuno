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

      {/* Normifesto */}
      <a
        href="https://normifesto.netlify.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="pixel-border block mb-6"
        style={{ background: '#48494b', textDecoration: 'none' }}
      >
        <div className="p-4 text-center">
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#e3e5e4', letterSpacing: 3, lineHeight: 1.6 }}>
            THE NORMIFESTO
          </div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: '#c8cac9', marginTop: 8, lineHeight: 1.4 }}>
            What The Normies stand for, on-chain and forever.
          </div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#e3e5e4', marginTop: 12 }}>
            ▶ READ IT
          </div>
        </div>
      </a>

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
