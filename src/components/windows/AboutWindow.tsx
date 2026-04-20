import Image from 'next/image'

export default function AboutWindow() {
  return (
    <div className="flex gap-0 h-full">
      {/* Left: NFT image panel */}
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center gap-3 p-4"
        style={{ background: '#48494b', minWidth: 160 }}
      >
        <div style={{ border: '3px solid #e3e5e4', boxShadow: '4px 4px 0 #000' }}>
          <Image
            src="/8362.png"
            alt="Normie #8362"
            width={120}
            height={120}
            style={{ imageRendering: 'pixelated', display: 'block' }}
            priority
          />
        </div>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8, color: '#e3e5e4', textAlign: 'center', lineHeight: 1.8,
        }}>
          NORMIE<br />#8362
        </div>
      </div>

      {/* Right: info */}
      <div className="flex-1 p-4 overflow-auto" style={{ background: '#e3e5e4' }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#48494b', marginBottom: 14 }}>
          @osaykancuno
        </div>

        <div className="mb-5" style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: '#48494b', lineHeight: 1.6 }}>
          Community builder & Web3 creator.
          <br /><br />
          I build tools, games and experiences
          for NFT communities — turning on-chain
          traits into real interactions.
          <br /><br />
          6 tools for The Normies.
          2 tools for Khôra / BOOA.
          Free frameworks for fellow builders.
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['NORMIE #8362', 'BUILDER', 'BOOA HOLDER', 'WEB3'].map(tag => (
            <span key={tag} style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: 7,
              padding: '3px 6px', background: '#48494b', color: '#e3e5e4', border: '1px solid #000',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Link */}
        <a
          href="https://x.com/OsayKancuno"
          target="_blank"
          rel="noopener noreferrer"
          className="pixel-btn inline-block"
          style={{ fontSize: 8, textDecoration: 'none' }}
        >
          ▶ TWITTER / X
        </a>
      </div>
    </div>
  )
}
