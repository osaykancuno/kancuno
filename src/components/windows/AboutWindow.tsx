import Image from 'next/image'

export default function AboutWindow() {
  return (
    <div className="flex flex-col sm:flex-row gap-0 h-full">
      {/* Left (or top on mobile): NFT image panel */}
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center gap-3 p-4 w-full sm:w-auto sm:min-w-[160px]"
        style={{ background: 'var(--nf-ink)' }}
      >
        <div style={{ border: '3px solid var(--nf-bg)', boxShadow: '4px 4px 0 var(--nf-edge)' }}>
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
          fontSize: 8, color: 'var(--nf-bg)', textAlign: 'center', lineHeight: 1.8,
        }}>
          NORMIE<br />#8362
        </div>
      </div>

      {/* Right: info */}
      <div className="flex-1 p-4 overflow-auto" style={{ background: 'var(--nf-bg)' }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: 'var(--nf-ink)', marginBottom: 14 }}>
          @osaykancuno
        </div>

        {/* Tagline */}
        <div className="mb-4" style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: 8,
          color: 'var(--nf-ink)', lineHeight: 2,
        }}>
          ON-CHAIN VIBECODING<br />&rarr; OFF-CHAIN EXPERIENCES
        </div>

        {/* Bio */}
        <div className="mb-4" style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: 'var(--nf-text)', lineHeight: 1.6 }}>
          Founder of <strong>NEONFACES</strong>: 5555 fully on-chain pixel faces on
          Robinhood Chain. Member and holder of <strong>THE100</strong> in The Normies.
          We will change the world one pixel at a time.
        </div>

        {/* Personal quote */}
        <div className="mb-5" style={{
          fontFamily: "'VT323', monospace", fontSize: 17, color: 'var(--nf-text)',
          borderLeft: '3px solid var(--nf-ink)', paddingLeft: 10, lineHeight: 1.5, fontStyle: 'italic',
        }}>
          &ldquo;Culture belongs to the people who create it.&rdquo;
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['FOUNDER · NEONFACES', 'THE100 HOLDER', 'NORMIE #8362'].map(tag => (
            <span key={tag} style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: 7,
              padding: '3px 6px', background: 'var(--nf-ink)', color: 'var(--nf-bg)', border: '1px solid var(--nf-edge)',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Founder of */}
        <div style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: 6,
          color: 'var(--nf-mute)', letterSpacing: 2, marginBottom: 8,
        }}>
          FOUNDER OF
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { label: 'NEONFACES',          href: 'https://neonfaces.xyz/' },
            { label: 'NORMIES YACHT CLUB', href: 'https://normiesyachtclub.com/' },
            { label: '8362 COFFEE',        href: 'https://8362coffee.com/' },
          ].map(t => (
            <a
              key={t.label}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                padding: '3px 6px', background: 'var(--nf-card)', color: 'var(--nf-text)',
                border: '1px solid var(--nf-edge)', boxShadow: '2px 2px 0 var(--nf-ink)',
                textDecoration: 'none',
              }}
            >
              {t.label}
            </a>
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
