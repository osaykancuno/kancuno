'use client'
// The holders' page: connect the wallet that holds a K1N0 (or paste any address to just look),
// see every K1N0 it holds and open one in its Look studio to change its look on-chain.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { Zt } from './Zt'
import { KThumb } from './KArt'
import { defaultDesign, type KDesign } from '@/lib/lab/design'
import { coloursFrom, decodeLook, designFromColours, MAX_SUPPLY, type Colours, type Look } from '@/lib/lab/onchain'
import { connect, dataOf, discoverWallets, explain, KLAB, ownedBy, short, type WalletInfo } from '@/lib/lab/chain'

interface Piece { id: number; colours: Colours; look: Look; title: string; design: KDesign }

const parse = (id: number, hex: string): Piece => {
  const h = hex.slice(2)
  const tlen = parseInt(h.slice(28, 30), 16)
  const colours = coloursFrom('0x' + h.slice(0, 8))
  const look = decodeLook('0x' + h.slice(8, 24))
  const title = String.fromCharCode(...(h.slice(30, 30 + tlen * 2).match(/.{2}/g) ?? []).map(x => parseInt(x, 16)))
  // built once here, so the thumbnail is not redrawn on every render
  return { id, colours, look, title, design: designFromColours(colours, defaultDesign(), look, `K1N0 ${id}`) }
}

const CAN = [
  { name: 'Effects', text: 'Give each of its four colours an effect: glow, pulse, blink, float, shimmer, neon, metal, glitch. The background has its own.' },
  { name: 'Speed and view', text: 'Set how fast it moves and the 3D view it shows: turn, height, zoom.' },
  { name: 'On-chain', text: 'Saving a look costs only gas. The image, the 3D piece and OpenSea show it right away.' },
  { name: 'Its story', text: 'Every look stays on-chain with who set it and when. When it changes hands, the story goes on.' },
]

export default function HoldersView() {
  const router = useRouter()
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [who, setWho] = useState('')
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [pieces, setPieces] = useState<Piece[] | null>(null)
  const [goto, setGoto] = useState('')
  const [run, setRun] = useState(0) // bumped on every lookup, so the same address can be read again

  useEffect(() => discoverWallets(setWallets), [])

  useEffect(() => {
    if (!who) return
    let alive = true
    setPieces(null)
    setError('')
    setBusy('Reading Ethereum…')
    ;(async () => {
      try {
        const ids = await ownedBy(who)
        const rows: Piece[] = []
        for (let i = 0; i < ids.length && alive; i += 8) { // a few at a time, so public RPCs are not flooded
          const batch = ids.slice(i, i + 8)
          rows.push(...(await Promise.all(batch.map(id => dataOf(id).then(h => parse(id, h))))))
        }
        if (!alive) return
        setPieces(rows.sort((a, b) => a.id - b.id))
      } catch (e) {
        if (alive) setError(e instanceof Error && !(e as { code?: number }).code ? 'Ethereum could not be read right now. Try again in a moment.' : explain(e))
      } finally {
        if (alive) setBusy('')
      }
    })()
    return () => { alive = false }
  }, [who, run])

  const connectWith = async (w: WalletInfo) => {
    setError('')
    try {
      setBusy('Connecting…')
      const a = await connect(w.provider)
      if (!/^0x[0-9a-fA-F]{40}$/.test(a)) throw new Error('The wallet did not share an address.')
      setWho(a)
      setRun(r => r + 1)
    } catch (e) {
      setBusy('')
      setError(e instanceof Error && !(e as { code?: number }).code ? e.message : explain(e))
    }
  }
  const lookUp = (e: FormEvent) => {
    e.preventDefault()
    const a = typed.trim()
    if (!/^0x[0-9a-fA-F]{40}$/.test(a)) { setError('Paste a full Ethereum address: 0x followed by 40 characters.'); return }
    if (/^0x0{40}$/.test(a)) { setError('That is the zero address: nobody holds pieces there.'); return }
    setWho(a)
    setRun(r => r + 1)
  }

  return (
    <div className="lab-tool hv">
      <header className="lab-tool__head">
        <span className="lab-label">Holders</span>
        <h1 className="lab-tool__title"><Zt>Your K1N0</Zt></h1>
        <p className="lab-note"><Zt>Hold a K1N0? Find it here and change its look on-chain. The colours stay as minted; everything else keeps moving.</Zt></p>
      </header>

      {!KLAB.live ? (
        <div className="lab-panel lab-section">
          <p><Zt>The K1N0 contract is not live yet.</Zt></p>
        </div>
      ) : (
        <div className="hv-grid">
          <div className="hv-main">
            <section className="lab-panel lab-section" aria-labelledby="hv-find">
              <h2 id="hv-find" className="lab-section__title">Find your pieces</h2>
              {wallets.length > 0 ? (
                <div className="mint__wallets" role="group" aria-label="Connect a wallet">
                  {wallets.map(w => (
                    <button key={w.id} type="button" className="lab-btn lab-btn--primary" onClick={() => connectWith(w)} disabled={!!busy}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {w.icon && <img src={w.icon} alt="" width={18} height={18} />} Connect {w.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="lab-note">
                  No wallet found in this browser. On a phone, open this page in your wallet app: <a href="https://metamask.app.link/dapp/www.kancuno.com/klab/mine">MetaMask</a> · <a href={`https://go.cb-w.com/dapp?cb_url=${encodeURIComponent('https://www.kancuno.com/klab/mine')}`}>Coinbase</a>.
                </p>
              )}
              <p className="lab-note">Connecting only reads which pieces you hold, through public Ethereum nodes: nothing is signed or sent.</p>
              <form className="lab-row" onSubmit={lookUp}>
                <label className="lab-label" htmlFor="hv-addr">Or an address</label>
                <input id="hv-addr" className="hv-addr" value={typed} onChange={e => setTyped(e.target.value)} placeholder="0x…" spellCheck={false} autoComplete="off" />
                <button type="submit" className="lab-btn lab-btn--sm" disabled={!!busy}>Look</button>
              </form>
              <p className="lab-note" role="status" aria-live="polite">{busy}</p>
              {error && <p className="lab-error" role="alert">{error}</p>}
            </section>

            {who && pieces && (
              <section aria-labelledby="hv-list">
                <h2 id="hv-list" className="lab-label hv-list__title">
                  <Zt>{`${short(who)} · ${pieces.length} K1N0`}</Zt>
                </h2>
                {pieces.length === 0 ? (
                  <div className="lab-panel lab-section">
                    <p><Zt>No K1N0 in this wallet yet.</Zt></p>
                    <p className="lab-note">Make one in the Lab, no wallet needed, and mint it only if you want.</p>
                    <Link className="lab-btn lab-btn--primary" href="/klab/editor">Open the K Editor</Link>
                  </div>
                ) : (
                  <ul className="hv-list">
                    {pieces.map(p => (
                      <li key={p.id}>
                        <Link href={`/klab/token?id=${p.id}`} className="hv-card">
                          <KThumb design={p.design} alt="" size={240} />
                          <span className="hv-card__name"><Zt>{`K1N0 #${p.id}`}</Zt></span>
                          <span className="hv-card__title">{p.title || 'Untitled'}</span>
                          <span className="hv-card__go">Change its look <span aria-hidden="true">→</span></span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          <aside className="hv-side">
            <section className="lab-panel lab-section" aria-labelledby="hv-can">
              <h2 id="hv-can" className="lab-section__title">What a holder can do</h2>
              <dl className="hv-can">
                {CAN.map(c => <div key={c.name}><dt>{c.name}</dt><dd>{c.text}</dd></div>)}
              </dl>
              <p className="lab-note">Anyone can open a K1N0 and try looks; only its holder, or an app they chose, can save one.</p>
            </section>
            <form className="lab-row" onSubmit={e => { e.preventDefault(); const n = Math.floor(Number(goto)); if (goto !== '' && n >= 0 && n <= MAX_SUPPLY) router.push(`/klab/token?id=${n}`) }}>
              <label className="lab-label" htmlFor="hv-id">Know the number? K1N0 #</label>
              <input id="hv-id" className="tv-input" inputMode="numeric" value={goto} onChange={e => setGoto(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1" />
              <button type="submit" className="lab-btn lab-btn--sm">Open</button>
            </form>
          </aside>
        </div>
      )}
    </div>
  )
}
