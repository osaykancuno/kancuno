export default function ContactWindow() {
  return (
    <div className="p-4 h-full overflow-auto" style={{ background: '#e3e5e4' }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#48494b', marginBottom: 16 }}>
        GET IN TOUCH
      </div>

      <div className="flex flex-col gap-3">
        {/* Twitter */}
        <a
          href="https://x.com/OsayKancuno"
          target="_blank"
          rel="noopener noreferrer"
          className="pixel-border flex items-center gap-3 p-4"
          style={{ background: '#ffffff', textDecoration: 'none', color: '#48494b' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = '#48494b'
            ;(e.currentTarget as HTMLElement).style.color = '#ffffff'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = '#ffffff'
            ;(e.currentTarget as HTMLElement).style.color = '#48494b'
          }}
        >
          <span style={{ fontSize: 28, width: 36, textAlign: 'center', flexShrink: 0 }}>𝕏</span>
          <div className="flex-1">
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, marginBottom: 6 }}>
              TWITTER / X
            </div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 17, opacity: 0.8 }}>
              @OsayKancuno — follow me
            </div>
          </div>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>▶</span>
        </a>

        {/* Calendly placeholder */}
        <div
          className="pixel-border p-4"
          style={{ background: '#ffffff', opacity: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 28, width: 36, textAlign: 'center', flexShrink: 0 }}>📅</span>
            <div className="flex-1">
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#48494b', marginBottom: 6 }}>
                BOOK A CALL
              </div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 17, color: '#9a9c9b' }}>
                Calendly — coming soon
              </div>
            </div>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#c8cac9' }}>SOON</span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center" style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: '#9a9c9b' }}>
        Normie #8362 — kancuno.com
      </div>
    </div>
  )
}
