interface Tool {
  name: string
  desc: string
  url: string
  tag: string
  community: 'NORMIES' | 'BOOA'
}

const TOOLS: Tool[] = [
  // Normies — newest first
  { name: 'NORMIES UNIVERSITY',   tag: 'Agent Academy',     community: 'NORMIES', url: 'https://normie-university.vercel.app/',          desc: 'Enroll your Normie as a learning agent: buy skill modules in USDC and earn on-chain soulbound credentials that build a composable reputation other protocols can read.' },
  { name: 'AIR NORMIES',          tag: 'Gesture Suite',     community: 'NORMIES', url: 'https://air-normies.netlify.app/',               desc: 'Touchless app suite: point and pinch with your fingers to control Normies tools — no keyboard, no mouse.' },
  { name: 'THE NORMIES CITY',     tag: '3D Cityscape',      community: 'NORMIES', url: 'https://the-normies-city.vercel.app/',           desc: 'Every Normie is a building in a 3D city — orbit from above, fly through, or drop into street view and walk.' },
  { name: 'NORMIE STICKER',       tag: 'AR Studio',         community: 'NORMIES', url: 'https://normie-sticker.vercel.app',              desc: 'See your Normie in AR through your camera, pose it in the real world and export stickers or animated GIFs to share.' },
  { name: 'VIDEO NORMIFIER',      tag: 'Video → Pixel',     community: 'NORMIES', url: 'http://video-normifier.vercel.app',              desc: 'Upload a clip or record from your camera and turn it into pixel art. Pick aspect ratio, color mode, resolution and frame rate, then download.' },
  { name: 'SUPER NORMIE',         tag: 'Platformer',        community: 'NORMIES', url: 'http://super-normie-production.up.railway.app',  desc: 'Run, jump and stomp enemies in a community platformer. Daily challenges, multiplayer mode and a global leaderboard.' },
  { name: 'NORMIEMAP',            tag: '3D Globe + Chat',   community: 'NORMIES', url: 'http://normie-map-production.up.railway.app',    desc: 'Pin your Normie on a 3D globe as resident or traveler, link your X, chat in Normchat and watch the worldwide holder heatmap.' },
  { name: 'NORMSKY',              tag: 'Street Art Frames', community: 'NORMIES', url: 'http://normski-generator.vercel.app',            desc: 'Type a Token ID and frame your Normie on a concrete, brick or plaster wall. Export still images or animated GIFs at any resolution.' },
  // BOOA — newest first
  { name: 'MOLTBOOA LAB',         tag: 'Agent Simulator',   community: 'BOOA',    url: 'http://moltbooa-lab.vercel.app',                 desc: 'Simulate, chat, battle, and export your BOOA to production.' },
  { name: 'SKILL SYNERGY',        tag: 'Agent Matcher',     community: 'BOOA',    url: 'http://booa-skill-synergy.vercel.app',           desc: 'Find the right match: complementary skills of on-chain AI agents.' },
]

export default function ToolsWindow() {
  return (
    <div className="p-4 h-full overflow-auto" style={{ background: '#e3e5e4' }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#48494b', marginBottom: 4, lineHeight: 2 }}>
        ALL TOOLS
      </div>
      <div style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: '#9a9c9b', marginBottom: 16 }}>
        built by @osaykancuno
      </div>

      <div className="flex flex-col gap-3">
        {TOOLS.map(tool => (
          <div key={tool.name} className="pixel-border p-3" style={{ background: '#ffffff' }}>
            <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#48494b' }}>
                {tool.name}
              </span>
              <div className="flex gap-1 flex-shrink-0">
                <span style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                  padding: '2px 4px', background: '#48494b', color: '#ffffff', border: '1px solid #000',
                }}>
                  {tool.community}
                </span>
                <span style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                  padding: '2px 4px', background: 'transparent', color: '#48494b', border: '1px solid #48494b',
                }}>
                  {tool.tag}
                </span>
              </div>
            </div>
            <p style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: '#48494b', marginBottom: 8, lineHeight: 1.3 }}>
              {tool.desc}
            </p>
            <a href={tool.url} target="_blank" rel="noopener noreferrer"
              className="pixel-btn inline-block" style={{ fontSize: 7, textDecoration: 'none' }}>
              ▶ OPEN
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
