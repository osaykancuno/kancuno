'use client'
// A K1N0, read from Ethereum: the piece in 3D exactly as its NFT shows it, the image the contract
// draws, its traits and the story of its looks. Anyone can try a look here; the holder saves it
// on-chain (gas only), and it joins the story.
import { Zt } from './Zt'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { defaultDesign } from '@/lib/lab/design'
import {
  BG_FX, coloursFrom, dataHex, decodeLook, designFromColours, encodeLook, HEAD_FX, K1N0, MAX_SUPPLY, NAMES, SLOTS, SPEEDS, type Colours, type Look,
} from '@/lib/lab/onchain'
import {
  canSetLook, connect, contractUrl, dataOf, discoverWallets, ensureChain, explain, isMinted, KLAB, lookHistory, looksTotal, ownerOf, sendLook, short,
  tokenMarketUrl, tokenMeta, txUrl, waitTx, type LookEntry, type WalletInfo,
} from '@/lib/lab/chain'
import { useLab } from '@/lib/lab/store'
import K1N0Piece from './K1N0Piece'
import { Range, Section, Seg } from './controls'

interface Loaded {
  colours: Colours
  title: string
  look: Look
  owner: string
  image: string
  traits: { trait_type: string; value: string | number }[]
  history: LookEntry[]
}

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

export default function TokenView() {
  const params = useSearchParams()
  const router = useRouter()
  const { set } = useLab()
  const raw = params.get('id')
  const has = raw !== null && /^\d{1,6}$/.test(raw) // #0 is a real K1N0 too
  const id = has ? Number(raw) : -1
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState('')
  const [goto, setGoto] = useState('')
  const [draft, setDraft] = useState<Look | null>(null) // the look being tried
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [saving, setSaving] = useState('')
  const [saveError, setSaveError] = useState('')
  const [hash, setHash] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => discoverWallets(setWallets), [])

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
          setData({ ...p, owner, image: meta?.image ?? '', traits: meta?.attributes ?? [], history })
          setDraft(null)
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
  }, [has, id, reload])

  const look = draft ?? data?.look ?? null
  const shown = useMemo(() => (data && look ? dataHex(data.colours, look, looksTotal(data.history), data.title) : ''), [data, look])
  const edit = (p: Partial<Look>) => setDraft(d => ({ ...(d ?? data!.look), ...p }))
  const setFx = (slot: number, v: number) => edit({ fx: (look!.fx.map((x, i) => (i === slot ? v : x)) as Look['fx']) })

  const [walletId, setWalletId] = useState('')
  const same = !!draft && !!data && encodeLook(draft) === encodeLook(data.look)
  const save = async () => {
    if (!data || !draft || same) return
    const w = wallets.find(x => x.id === walletId) ?? wallets[0]
    if (!w) { setSaveError('A wallet is needed to save the look.'); return }
    setSaveError('')
    try {
      setSaving('Connecting…')
      const addr = await connect(w.provider)
      await ensureChain(w.provider)
      if (!(await canSetLook(id, addr))) throw new Error(`Only the holder of K1N0 #${id} (${short(data.owner)}), or an app they chose, can save its look.`)
      setSaving('Confirm in your wallet…')
      const h = await sendLook(w.provider, addr, id, draft)
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
      setReload(r => r + 1)
    } catch (e) {
      setSaving('')
      setSaveError(e instanceof Error && !(e as { code?: number }).code ? e.message : explain(e))
    }
  }

  const remix = () => {
    if (!data) return
    set(designFromColours(data.colours, defaultDesign(), data.look, `Remix of K1N0 ${id}`))
    router.push('/lab/editor')
  }

  return (
    <div className="lab-tool tv">
      <header className="lab-tool__head">
        <span className="lab-label">K1N0</span>
        <h1 className="lab-tool__title"><Zt>{has ? `K1N0 #${id}` : 'K1N0'}</Zt></h1>
        <p className="lab-note">{data ? <Zt>{id === 0 ? 'The K4NCUN0 logo' : data.title || 'Untitled'}</Zt> : `One of ${MAX_SUPPLY.toLocaleString('en')}, each with four colours of its own, fully on-chain.`}</p>
      </header>

      {!KLAB.live ? (
        <div className="lab-panel lab-section">
          <p>The <Zt>K1N0</Zt> contract is not live yet. Make your K now: when the mint opens, it is one click away.</p>
          <Link className="lab-btn lab-btn--primary" href="/lab/editor">Open the K Editor</Link>
        </div>
      ) : (
        <div className="tv-grid">
          <div className="tv-main">
            <div className="lab-stage tv-stage">
              {data && shown
                ? <K1N0Piece data={shown} label={`K1N0 #${id} in 3D: drag to turn it`} />
                : <p className="lab-note" style={{ padding: 24 }}><Zt>{error || (has ? 'Reading Ethereum…' : 'Choose a K1N0 below.')}</Zt></p>}
            </div>
            {data && <p className="lab-note" style={{ textAlign: 'center' }}>{draft ? 'Trying a new look: only you see it until it is saved.' : 'Drag to turn it, scroll to zoom, double-click for its view.'}</p>}
          </div>

          <div className="tv-side">
            {data && look && (
              <>
                <div className="tv-colours" aria-label="Its four colours">
                  {data.colours.map((c, i) => <span key={i} className="tv-col"><i style={{ background: K1N0[c] }} />{SLOTS[i]}: {NAMES[c]}</span>)}
                </div>
                <p className="lab-note">Held by <a href={`${KLAB.chain.explorer}/address/${data.owner}`} target="_blank" rel="noopener noreferrer">{short(data.owner)}</a> · {looksTotal(data.history)} {looksTotal(data.history) === 1 ? 'look' : 'looks'} so far</p>

                <Section title="Look studio">
                  <p className="lab-note">An effect for each colour, the speed and the view; the colours stay as minted. Try freely; the holder saves it on-chain for the gas only.</p>
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
                    {wallets.length > 1 && (
                      <select className="tv-wallet" aria-label="Wallet to save with" value={walletId || wallets[0].id} onChange={e => setWalletId(e.target.value)} disabled={!!saving}>
                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    )}
                    <button type="button" className="lab-btn lab-btn--primary" onClick={save} disabled={!draft || same || !!saving}>{saving || 'Save this look on-chain'}</button>
                    {draft && <button type="button" className="lab-btn lab-btn--ghost" onClick={() => setDraft(null)} disabled={!!saving}>Back to the current look</button>}
                  </div>
                  {hash && saving && <p className="lab-note"><a href={txUrl(hash)} target="_blank" rel="noopener noreferrer">Follow it on Etherscan ↗</a></p>}
                  {saveError && <p className="lab-error" role="alert">{saveError}</p>}
                </Section>

                <Section title="Its story">
                  <ol className="tv-history" reversed start={looksTotal(data.history)}>
                    {[...data.history].reverse().map(h => {
                      const l = decodeLook(h.look)
                      return (
                        <li key={h.n}>
                          <button type="button" className="tv-history__item" onClick={() => setDraft(l)} title="Show this look">
                            <strong>Look {h.n}</strong> · {short(h.by)} · {when(h.time)}
                            <span>{lookSummary(l)}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                </Section>

                {data.image && (
                  <figure className="tv-onchain">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={data.image} alt={`The image of K1N0 #${id}, drawn by the contract`} width={180} height={180} />
                    <figcaption className="lab-label">Its image, drawn by the contract</figcaption>
                  </figure>
                )}
                <div className="lab-row">
                  <a className="lab-btn" href={tokenMarketUrl(id)} target="_blank" rel="noopener noreferrer">OpenSea</a>
                  <button type="button" className="lab-btn lab-btn--ghost" onClick={remix}>Remix in the Lab</button>
                  <a className="lab-btn lab-btn--ghost" href={contractUrl()} target="_blank" rel="noopener noreferrer">Contract</a>
                </div>
              </>
            )}
            <form className="lab-row" onSubmit={e => { e.preventDefault(); const n = Math.floor(Number(goto)); if (goto !== '' && n >= 0) router.push(`/lab/token?id=${n}`) }}>
              <label className="lab-label" htmlFor="tv-id">Go to K1N0 #</label>
              <input id="tv-id" className="tv-input" inputMode="numeric" value={goto} onChange={e => setGoto(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder={String(has ? id : 0)} />
              <button type="submit" className="lab-btn lab-btn--sm">Go</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
