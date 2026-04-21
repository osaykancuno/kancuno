interface Tool {
  name: string
  desc: string
  url: string
  tag: string
  community: 'NORMIES' | 'BOOA'
}

const TOOLS: Tool[] = [
  // Normies
  { name: 'MESSAGE FROM NORMIES', tag: 'Community Wall',    community: 'NORMIES', url: 'https://messages-from-normies-production.up.railway.app/',  desc: 'Leave your mark, your message, your Normie.' },
  { name: 'NORMSKY',              tag: 'GIF Generator',     community: 'NORMIES', url: 'http://normski-generator.vercel.app',            desc: 'Your Normie with a Banksy-style effect.' },
  { name: 'NORMIEMAP',            tag: '3D Map',            community: 'NORMIES', url: 'http://normie-map-production.up.railway.app',    desc: 'Place your NFT, listen to music, chat live.' },
  { name: 'SUPER NORMIE',         tag: 'Platformer Game',   community: 'NORMIES', url: 'http://super-normie-production.up.railway.app',  desc: 'On-chain traits become real gameplay abilities.' },
  { name: 'VIDEO NORMIFIER',      tag: 'Video Editor',      community: 'NORMIES', url: 'http://video-normifier.vercel.app',              desc: 'Turn your videos (and REC) into pixel art.' },
  { name: 'NORMIE STICKER',       tag: 'AR + Stickers',     community: 'NORMIES', url: 'https://normie-sticker.vercel.app',              desc: 'View your Normie in AR, download stickers, share animated GIFs.' },
  // BOOA
  { name: 'SKILL SYNERGY',        tag: 'Agent Matcher',     community: 'BOOA',    url: 'http://booa-skill-synergy.vercel.app',           desc: 'Find the right match: complementary skills of on-chain AI agents.' },
  { name: 'MOLTBOOA LAB',         tag: 'Agent Simulator',   community: 'BOOA',    url: 'http://moltbooa-lab.vercel.app',                 desc: 'Simulate, chat, battle, and export your BOOA to production.' },
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
