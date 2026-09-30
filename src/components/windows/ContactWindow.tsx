export default function ContactWindow() {
  return (
    <div className="p-4 h-full overflow-auto" style={{ background: 'var(--nf-bg)' }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: 'var(--nf-ink)', marginBottom: 16 }}>
        GET IN TOUCH
      </div>

      <div className="flex flex-col gap-3">
        {/* Twitter */}
        <a
          href="https://x.com/OsayKancuno"
          target="_blank"
          rel="noopener noreferrer"
          className="pixel-border flex items-center gap-3 p-4"
          style={{ background: 'var(--nf-card)', textDecoration: 'none', color: 'var(--nf-ink)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--nf-ink)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--nf-card)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--nf-card)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--nf-ink)'
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

        {/* Telegram */}
        <a
          href="https://t.me/kancuno"
          target="_blank"
          rel="noopener noreferrer"
          className="pixel-border flex items-center gap-3 p-4"
          style={{ background: 'var(--nf-card)', textDecoration: 'none', color: 'var(--nf-ink)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--nf-ink)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--nf-card)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--nf-card)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--nf-ink)'
          }}
        >
          <span style={{ fontSize: 22, width: 36, textAlign: 'center', flexShrink: 0 }}>✈</span>
          <div className="flex-1">
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, marginBottom: 6 }}>
              TELEGRAM
            </div>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: 17, opacity: 0.8 }}>
              @kancuno — message me
            </div>
          </div>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>▶</span>
        </a>

        {/* Calendly placeholder */}
        <div
          className="pixel-border p-4"
          style={{ background: 'var(--nf-card)', opacity: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 28, width: 36, textAlign: 'center', flexShrink: 0 }}>📅</span>
            <div className="flex-1">
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: 'var(--nf-ink)', marginBottom: 6 }}>
                BOOK A CALL
              </div>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: 17, color: 'var(--nf-mute)' }}>
                Calendly — coming soon
              </div>
            </div>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: 'var(--nf-soft)' }}>SOON</span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: 'var(--nf-mute)' }}>
        K4NCUN0
      </div>
    </div>
  )
}
