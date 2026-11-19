'use client'
// A K1N0, read from Ethereum: the piece in 3D exactly as its NFT shows it, the image the contract
// draws, its traits and the story of its looks. Anyone can try a look here and share it as a link;
// the holder saves it on-chain (gas only), and it joins the story.
import { Zt } from './Zt'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { defaultDesign } from '@/lib/lab/design'
import {
  BG_FX, coloursFrom, dataHex, decodeLook, designFromColours, encodeLook, HEAD_FX, K1N0, MAX_SUPPLY, NAMES, SLOTS, SPEEDS, type Colours, type Look,
} from '@/lib/lab/onchain'
import {
  canSetLook, collectionUrl, connect, contractUrl, dataOf, discoverWallets, ensureChain, explain, isMinted, KLAB, lookHistory, looksTotal, ownerOf, sendLook, short,
  tokenMarketUrl, tokenMeta, txUrl, waitTx, type LookEntry, type WalletInfo,
} from '@/lib/lab/chain'
import { useLab } from '@/lib/lab/store'
import K1N0Piece from './K1N0Piece'
import { Range, Seg } from './controls'

interface Loaded {
  colours: Colours
  title: string
  look: Look
  owner: string
  image: string
  traits: { trait_type: string; value: string | number }[]
  history: LookEntry[]
}
type Tab = 'look' | 'story' | 'details'

const parseData = (hex: string) => {
  const h = hex.slice(2)
  const tlen = parseInt(h.slice(28, 30), 16)
  return {
    colours: coloursFrom('0x' + h.slice(0, 8)),
    look: decodeLook('0x' + h.slice(8, 24)),
    title: String.fromCharCode(...(h.slice(30, 30 + tlen * 2).match(/.{2}/g) ?? []).map(x => parseInt(x, 16))),
  }
}
const when = (t: number) => new Date(t * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const lookSummary = (l: Look) =>
  [`bg ${BG_FX[l.fx[0]]}`, ...[1, 2, 3].map(i => `${SLOTS[i].toLowerCase()} ${HEAD_FX[l.fx[i]]}`), SPEEDS[l.speed]].join(' · ')
/** A look from a shared link, only if every value is one the renderer accepts */
const lookFromParam = (p: string | null): Look | null => {
  if (!p || !/^0x[0-9a-f]{16}$/i.test(p)) return null
  const l = decodeLook(p)
  const ok = l.fx[0] < BG_FX.length && l.fx.slice(1).every(v => v < HEAD_FX.length) && l.speed < SPEEDS.length &&
    l.yaw >= -180 && l.yaw <= 178 && l.pitch >= 20 && l.pitch <= 89 && l.zoom >= 60 && l.zoom <= 190
  return ok ? l : null
}
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
/** A random look that stays easy on the eye: often one quiet colour, a view near the front */
const surprise = (): Look => ({
  fx: [rnd(0, BG_FX.length - 1), ...[0, 0, 0].map(() => (Math.random() < 0.25 ? 0 : rnd(1, HEAD_FX.length - 1)))] as Look['fx'],
  speed: rnd(0, 3),
  yaw: rnd(-30, 30) * 2,
  pitch: rnd(52, 84),
  zoom: rnd(88, 120),
})

export default function TokenView() {
  const params = useSearchParams()
  const router = useRouter()
  const { set } = useLab()
  const raw = params.get('id')
  const has = raw !== null && /^\d{1,6}$/.test(raw) // #0 is a real K1N0 too
  const id = has ? Number(raw) : -1
  const shared = params.get('look')
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState('')
  const [goto, setGoto] = useState('')
  const [draft, setDraft] = useState<Look | null>(null) // the look being tried
  const [fromLink, setFromLink] = useState(false)
  const [tab, setTab] = useState<Tab>('look')
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [walletId, setWalletId] = useState('')
  const [addr, setAddr] = useState('')
  const [holder, setHolder] = useState<boolean | null>(null) // may the connected address save looks?
  const [saving, setSaving] = useState('')
  const [saveError, setSaveError] = useState('')
  const [hash, setHash] = useState('')
  const [copied, setCopied] = useState('')
  const [reload, setReload] = useState(0)
  const idNow = useRef(id) // the K1N0 on screen: a save that ends later must not pull the visitor back
  idNow.current = id
  const appliedLink = useRef('') // the ?look= already applied, so a new shared link is applied once

  useEffect(() => discoverWallets(setWallets), [])

  // a new K1N0 on screen: nothing of the previous one carries over
  useEffect(() => { setSaveError(''); setHash(''); setSaving(''); setCopied('') }, [id])

  useEffect(() => {
    setData(null)
    setError('')
    if (!KLAB.live || !has) return
    if (id > MAX_SUPPLY) { setError(`There is no K1N0 #${id}: numbers go from 0 to ${MAX_SUPPLY.toLocaleString('en')}.`); return }
    let alive = true
    // right after a mint or a new look a public RPC may lag a block: try a few times.
    // NoToken (0x79d93f49) means not minted; anything else is the network.
    const load = async (tries: number): Promise<void> => {
      try {
        const [hex, owner, history] = await Promise.all([dataOf(id), ownerOf(id), lookHistory(id)])
        if (!history.length) throw new Error('lagging node') // every K1N0 has at least its first look
        const meta = await tokenMeta(id).catch(() => null) // heavy call: the page works without it
        const p = parseData(hex)
        if (alive) {
          // only an image data URL is shown or offered as a download (never a link of another kind)
          const image = typeof meta?.image === 'string' && /^data:image\/(svg\+xml|png);/.test(meta.image) ? meta.image : ''
          setData({ ...p, owner, image, traits: Array.isArray(meta?.attributes) ? meta.attributes : [], history })
          const fresh = !!shared && appliedLink.current !== `${id}:${shared}`
          const linked = fresh ? lookFromParam(shared) : null
          if (shared) appliedLink.current = `${id}:${shared}`
          setDraft(linked && encodeLook(linked) !== encodeLook(p.look) ? linked : null)
          setFromLink(!!linked)
        }
      } catch (e) {
        if (!alive) return
        // NoToken in the revert, or (when the RPC drops revert data) the map of used numbers says so
        const notMinted = /0x79d93f49/.test(JSON.stringify((e as { data?: unknown })?.data ?? '')) || (await isMinted(id).catch(() => true)) === false
        if (!alive) return
        if (tries > 0) { await new Promise(r => setTimeout(r, notMinted ? 2500 : 4000)); return load(tries - 1) }
        setError(notMinted ? `K1N0 #${id} is not minted yet.` : 'Ethereum could not be read right now. Reload the page to try again.')
      }
    }
    load(3)
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [has, id, reload, shared])

  // is the connected address the holder (or an app the holder chose)?
  useEffect(() => {
    setHolder(null)
    if (!addr || !data) return
    let alive = true
    canSetLook(id, addr).then(ok => { if (alive) setHolder(ok) }, () => undefined)
    return () => { alive = false }
  }, [addr, id, data])

  const look = draft ?? data?.look ?? null
  const shown = useMemo(() => (data && look ? dataHex(data.colours, look, looksTotal(data.history), data.title) : ''), [data, look])
  const edit = (p: Partial<Look>) => setDraft(d => ({ ...(d ?? data!.look), ...p }))
  const setFx = (slot: number, v: number) => edit({ fx: (look!.fx.map((x, i) => (i === slot ? v : x)) as Look['fx']) })
  const same = !!draft && !!data && encodeLook(draft) === encodeLook(data.look)
  const wallet = () => wallets.find(x => x.id === walletId) ?? wallets[0]

  const connectWallet = async () => {
    const w = wallet()
    if (!w) { setSaveError('A wallet is needed: install Rabby or MetaMask, or use WalletConnect on a phone.'); return '' }
    setSaveError('')
    setSaving('Connecting…')
    try {
      const a = await connect(w.provider)
      setAddr(a)
      return a
    } finally {
      setSaving('')
    }
  }

  const save = async () => {
    if (!data || !draft || same) return
    const w = wallet()
    const chosen = draft // the look on screen when Save was pressed
    try {
      const a = await connectWallet() // every time: the account in the wallet may have changed
      if (!a || !w) return
      setSaving('Checking…')
      await ensureChain(w.provider)
      if (!(await canSetLook(id, a))) throw new Error(`Only the holder of K1N0 #${id} (${short(data.owner)}), or an app they chose, can save its look. Share it with them as a link.`)
      setSaving('Confirm in your wallet…')
      const h = await sendLook(w.provider, a, id, chosen)
      setHash(h)
      setSaving('Saving on-chain…')
      await waitTx(h)
      // public RPCs may lag a block: wait until the new look is readable, then show it
      const before = looksTotal(data.history)
      for (let i = 0; i < 8; i++) {
        const n = looksTotal(await lookHistory(id).catch(() => []))
        if (n > before) break
        await new Promise(r => setTimeout(r, 3000))
      }
      setSaving('')
      if (idNow.current !== id) return // the visitor moved to another K1N0 meanwhile
      setFromLink(false)
      router.replace(`/klab/token?id=${id}`, { scroll: false })
      setReload(r => r + 1)
    } catch (e) {
      setSaving('')
      setSaveError(e instanceof Error && !(e as { code?: number }).code ? e.message : explain(e))
    }
  }

  const pageUrl = (l?: Look) => `https://www.kancuno.com/klab/token?id=${id}${l ? `&look=${encodeLook(l)}` : ''}`
  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(what) } catch { setCopied('Copy failed: select the address bar instead.') }
    setTimeout(() => setCopied(''), 2500)
  }

  const remix = () => {
    if (!data) return
    set(designFromColours(data.colours, defaultDesign(), look ?? data.look, `Remix of K1N0 ${id}`))
    router.push('/klab/editor')
  }

  const looks = data ? looksTotal(data.history) : 0
  const youHold = holder === true
  const share = encodeURIComponent(`K1N0 #${id} on THE K.LAB: fully on-chain, and its look keeps changing.`)

  return (
    <div className="lab-tool tv">
      <header className="lab-tool__head tv-head">
        <span className="lab-label">K1N0</span>
        <h1 className="lab-tool__title"><Zt>{has ? `K1N0 #${id}` : 'K1N0'}</Zt></h1>
        <p className="lab-note">{data ? <Zt>{id === 0 ? 'The first K1N0' : data.title || 'Untitled'}</Zt> : `One of ${MAX_SUPPLY.toLocaleString('en')}, each with four colours of its own, fully on-chain.`}</p>
        <div className="tv-head__go">
          <form className="lab-row" onSubmit={e => { e.preventDefault(); const n = Math.floor(Number(goto)); if (goto !== '' && n >= 0 && n <= MAX_SUPPLY) router.push(`/klab/token?id=${n}`) }}>
            <label className="lab-label" htmlFor="tv-id">Go to #</label>
            <input id="tv-id" className="tv-input" inputMode="numeric" value={goto} onChange={e => setGoto(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder={String(has ? id : 0)} />
            <button type="submit" className="lab-btn lab-btn--sm">Go</button>
          </form>
          <Link className="lab-btn lab-btn--sm lab-btn--ghost" href="/klab/mine"><span><Zt>My K1N0</Zt></span></Link>
        </div>
      </header>

      {!KLAB.live ? (
        <div className="lab-panel lab-section">
          <p>The <Zt>K1N0</Zt> contract is not live yet. Make your K1N0 now: when the mint opens, it is one click away.</p>
          <Link className="lab-btn lab-btn--primary" href="/klab/editor">Open the K Editor</Link>
        </div>
      ) : (
        <div className="tv-grid">
          <div className="tv-main">
            <div className="lab-stage tv-stage">
              {data && shown
                ? <K1N0Piece data={shown} label={`K1N0 #${id} in 3D: drag to turn it`} />
                : <p className="lab-note" style={{ padding: 24 }}><Zt>{error || (has ? 'Reading Ethereum…' : 'Choose a K1N0 above.')}</Zt></p>}
              {draft && <span className="tv-badge">{fromLink ? 'Shared look · preview' : 'New look · preview'}</span>}
            </div>
            {data && (
              <>
                <p className="lab-note tv-hint">{draft ? 'Only you see this look until the holder saves it on-chain.' : 'Drag to turn it, scroll to zoom, double-click for its view.'}</p>
                <div className="tv-actions">
                  <a className="lab-btn lab-btn--sm" href={tokenMarketUrl(id)} target="_blank" rel="noopener noreferrer">OpenSea<span className="lab-sr"> (opens in a new tab)</span></a>
                  <a className="lab-btn lab-btn--sm" href={`https://x.com/intent/post?text=${share}&url=${encodeURIComponent(pageUrl())}`} target="_blank" rel="noopener noreferrer">Share on X<span className="lab-sr"> (opens in a new tab)</span></a>
                  <button type="button" className="lab-btn lab-btn--sm" onClick={() => copy(pageUrl(), 'Link copied.')}>Copy link</button>
                  <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={remix}>Remix in the Lab</button>
                </div>
                <p className="lab-status" role="status" aria-live="polite">{copied}</p>
              </>
            )}
          </div>

          {data && look && (
            <div className="tv-side">
              <div className="lab-panel tv-card">
                <div className="tv-colours" aria-label="Its four colours, fixed at mint">
                  {data.colours.map((c, i) => <span key={i} className="tv-col"><i style={{ background: K1N0[c] }} />{SLOTS[i]}: {NAMES[c]}</span>)}
                </div>
                <p className="lab-note">
                  Held by <a href={`${KLAB.chain.explorer}/address/${data.owner}`} target="_blank" rel="noopener noreferrer">{short(data.owner)}</a>
                  {youHold && <strong className="tv-you"> · that’s you</strong>} · {looks} {looks === 1 ? 'look' : 'looks'} so far
                </p>
              </div>

              <div className="tv-tabs" role="tablist" aria-label="K1N0 tools">
                {([['look', 'Look studio'], ['story', `Story · ${looks}`], ['details', 'Details']] as [Tab, string][]).map(([t, label]) => (
                  <button key={t} type="button" role="tab" id={`tv-tab-${t}`} aria-controls={`tv-panel-${t}`} aria-selected={tab === t} tabIndex={tab === t ? 0 : -1} className="tv-tab" onClick={() => setTab(t)}
                    onKeyDown={e => {
                      const order: Tab[] = ['look', 'story', 'details']
                      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
                      if (!step && e.key !== 'Home' && e.key !== 'End') return
                      e.preventDefault()
                      const next = e.key === 'Home' ? order[0] : e.key === 'End' ? order[order.length - 1] : order[(order.indexOf(tab) + step + order.length) % order.length]
                      setTab(next)
                      document.getElementById(`tv-tab-${next}`)?.focus()
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'look' && (
                <section className="lab-panel lab-section" role="tabpanel" tabIndex={0} id="tv-panel-look" aria-labelledby="tv-tab-look">
                  <p className="lab-note">An effect for each colour, the speed and the view; the colours stay as minted. Anyone can try. The holder saves it on-chain for the gas only.</p>
                  {/* while a look is being saved, the preview cannot change: the wallet signs exactly what is shown */}
                  <fieldset className="tv-fieldset" disabled={!!saving}>
                  <div className="tv-fx">
                    {SLOTS.map((name, slot) => (
                      <label key={name} className="tv-fx__row">
                        <span><i style={{ background: K1N0[data.colours[slot]] }} />{name}</span>
                        <select value={look.fx[slot]} onChange={e => setFx(slot, Number(e.target.value))}>
                          {(slot === 0 ? BG_FX : HEAD_FX).map((n, i) => <option key={n} value={i}>{n}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                  <Seg label="Speed" value={String(look.speed)} options={SPEEDS.map((n, i) => ({ value: String(i), label: n }))} onChange={v => edit({ speed: Number(v) })} />
                  <Range label="Turn" min={-180} max={178} step={2} value={look.yaw} format={v => `${v}°`} onChange={v => edit({ yaw: v })} />
                  <Range label="Height" min={20} max={89} step={1} value={look.pitch} format={v => `${v}°`} onChange={v => edit({ pitch: v })} />
                  <Range label="Zoom" min={60} max={190} step={1} value={look.zoom} format={v => `${v}%`} onChange={v => edit({ zoom: v })} />
                  <div className="lab-row">
                    <button type="button" className="lab-btn lab-btn--sm" onClick={() => { setDraft(surprise()); setFromLink(false) }}>Surprise me</button>
                    <button type="button" className="lab-btn lab-btn--sm" onClick={() => edit({ yaw: 0, pitch: 74, zoom: 100 })}>Front view</button>
                    {draft && <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => { setDraft(null); setFromLink(false) }} disabled={!!saving}>Back to the saved look</button>}
                  </div>

                  </fieldset>

                  <div className="tv-save">
                    {holder === false ? (
                      <>
                        <p className="lab-note">{short(addr)} does not hold this <Zt>K1N0</Zt>. Send the holder your look: they open the link and save it.</p>
                        <div className="lab-row">
                          <button type="button" className="lab-btn lab-btn--primary" onClick={() => copy(pageUrl(look), 'Look link copied: send it to the holder.')} disabled={!draft || same}>Copy the link to this look</button>
                          <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => { setAddr(''); setSaveError('') }}>Use another account</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="lab-row">
                          {wallets.length > 1 && !addr && (
                            <select className="tv-wallet" aria-label="Wallet to save with" value={walletId || wallets[0].id} onChange={e => setWalletId(e.target.value)} disabled={!!saving}>
                              {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                          )}
                          <button type="button" className="lab-btn lab-btn--primary" onClick={save} disabled={!draft || same || !!saving}>{saving || 'Save this look on-chain'}</button>
                          {!addr && <button type="button" className="lab-btn lab-btn--sm lab-btn--ghost" onClick={() => connectWallet().catch(e => setSaveError(explain(e)))} disabled={!!saving}>I hold it: connect</button>}
                        </div>
                        {draft && !same && <button type="button" className="tv-linkbtn" onClick={() => copy(pageUrl(look), 'Look link copied.')}>Or copy a link to this look</button>}
                      </>
                    )}
                    {hash && saving && <p className="lab-note"><a href={txUrl(hash)} target="_blank" rel="noopener noreferrer">Follow it on Etherscan ↗</a></p>}
                    {saveError && <p className="lab-error" role="alert">{saveError}</p>}
                  </div>
                </section>
              )}

              {tab === 'story' && (
                <section className="lab-panel lab-section" role="tabpanel" tabIndex={0} id="tv-panel-story" aria-labelledby="tv-tab-story">
                  <p className="lab-note">Every look stays on-chain with who set it and when. Pick one to see it again; the holder can bring it back.</p>
                  <ol className="tv-history" reversed start={looks}>
                    {[...data.history].reverse().map(h => {
                      const l = decodeLook(h.look)
                      const current = encodeLook(l) === encodeLook(data.look) && h.n === looks
                      return (
                        <li key={h.n}>
                          <button type="button" className="tv-history__item" disabled={!!saving} onClick={() => { setDraft(current ? null : l); setFromLink(false); setTab('look') }} title="Show this look">
                            <strong>Look {h.n}{current ? ' · now' : ''}</strong> · {short(h.by)} · {when(h.time)}
                            <span>{lookSummary(l)}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                </section>
              )}

              {tab === 'details' && (
                <section className="lab-panel lab-section" role="tabpanel" tabIndex={0} id="tv-panel-details" aria-labelledby="tv-tab-details">
                  <div className="tv-details">
                    {data.image && (
                      <figure className="tv-onchain">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={data.image} alt={`The image of K1N0 #${id}, drawn by the contract`} width={180} height={180} />
                        <figcaption className="lab-label">Its image, drawn by the contract</figcaption>
                        <a className="lab-btn lab-btn--sm" href={data.image} download={`K1N0-${id}.${data.image.startsWith('data:image/png') ? 'png' : 'svg'}`}>Download image</a>
                      </figure>
                    )}
                    {data.traits.length > 0 && (
                      <ul className="tv-traits" aria-label="Traits">
                        {data.traits.map(t => <li key={t.trait_type}><span>{t.trait_type}</span>{String(t.value)}</li>)}
                      </ul>
                    )}
                  </div>
                  <p className="lab-note">Image, 3D piece and data live in the contract on Ethereum: no server, no IPFS. The colours never change; the latest look is what OpenSea shows.</p>
                  <div className="lab-row">
                    <a className="lab-btn lab-btn--sm" href={collectionUrl()} target="_blank" rel="noopener noreferrer">Collection<span className="lab-sr"> (OpenSea, opens in a new tab)</span></a>
                    <a className="lab-btn lab-btn--sm" href={contractUrl()} target="_blank" rel="noopener noreferrer">Contract<span className="lab-sr"> (opens in a new tab)</span></a>
                    <a className="lab-btn lab-btn--sm" href={`${KLAB.chain.explorer}/address/${data.owner}`} target="_blank" rel="noopener noreferrer">Holder<span className="lab-sr"> (opens in a new tab)</span></a>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
