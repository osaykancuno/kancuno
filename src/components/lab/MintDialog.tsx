'use client'
// "Mint this K": your K becomes a K1N0: the black X and blocks, and four colours of its own.
// One dialog, one button that moves forward on its own. The visitor sees the K1N0 exactly as the
// NFT will show it (the contract's own 3D piece), adjusts its four colours right here, picks a
// number, and knows before paying whether the colours are still free.
import { Zt } from './Zt'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  coloursFromDesign, cleanName, isDefaultName, dataHex, hasArtistName, INK, K1N0, lookFromDesign, MAX_SUPPLY, MINT_PRICE_ETH, mintCheck, mintReady, NAMES, SLOTS, validColours, type Colours,
} from '@/lib/lab/onchain'
import {
  coloursTaken, connect, contractUrl, discoverWallets, ensureChain, eth, explain, freeNumbers, KLAB, readMintState, sendMint,
  tokenMarketUrl, txUrl, waitMinted, type MintState, type WalletInfo,
} from '@/lib/lab/chain'
import { useLab } from '@/lib/lab/store'
import K1N0Piece from './K1N0Piece'

type Phase = 'check' | 'pick' | 'connecting' | 'signing' | 'pending' | 'done'

export function MintButton({ className = 'lab-btn lab-btn--primary' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}><span><Zt>Mint this K1N0</Zt></span></button>
      {open && <MintDialog onClose={() => setOpen(false)} />}
    </>
  )
}

/** The mint rules, live, next to every "Mint this K1N0" button: whether the design can be minted as
 *  it is, what the mint would change, what must change first, and whether its colours are still free. */
export function MintPanel({ note }: { note?: string }) {
  const { design, set } = useLab()
  const check = useMemo(() => mintCheck(design), [design])
  const valid = validColours(check.colours) && !check.problems.length
  const [taken, setTaken] = useState<number | false | null>(null) // false free, n = K1N0 #n, null unknown
  const [net, setNet] = useState(false)
  const [retry, setRetry] = useState(0)
  const key = check.colours.join('.')
  useEffect(() => {
    setTaken(null)
    setNet(false)
    if (!KLAB.live || !valid) return
    let alive = true
    const t = setTimeout(() => coloursTaken(check.colours).then(n => { if (alive) setTaken(n) }, () => { if (alive) setNet(true) }), 400)
    return () => { alive = false; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, valid, retry])

  const state = !valid ? 'bad' : typeof taken === 'number' ? 'taken' : check.changes.length ? 'warn' : taken === false || !KLAB.live ? 'ok' : 'wait'
  const freeLine = !valid || typeof taken === 'number' || !KLAB.live ? '' : taken === false ? 'These four colours are still free.' : net ? '' : 'Checking whether these colours are still free…'
  const title =
    state === 'bad' ? 'Not mintable yet'
      : state === 'taken' ? `These colours are already K1N0 #${taken}`
        : state === 'warn' ? `Mintable, with ${check.changes.length} ${check.changes.length === 1 ? 'change' : 'changes'}`
          : state === 'ok' ? 'Mint-ready: what you see is what you mint'
            : net ? 'The colours could not be checked' : 'Checking the colours…'

  return (
    <div className="mcheck" data-state={state}>
      <p className="mcheck__title" aria-live="polite"><i aria-hidden="true" /><span><Zt>{title}</Zt></span></p>
      <div className="mint__swaps" aria-label="The four colours it mints with">
        {check.colours.map((c, i) => <span key={i} className="mint__swap"><i style={{ background: K1N0[c] }} />{SLOTS[i]}: {NAMES[c]}</span>)}
      </div>
      {freeLine && state !== 'ok' && <p className="lab-note">{freeLine}</p>}
      {net && <p className="lab-note">Ethereum could not be read. <button type="button" className="tv-linkbtn" onClick={() => setRetry(r => r + 1)}>Try again</button></p>}
      {check.problems.length > 0 && <ul className="mcheck__list mcheck__list--bad">{check.problems.map(p => <li key={p}>{p}</li>)}</ul>}
      {state === 'taken' && <p className="lab-note">Each combination can be minted once. Change one of the four colours to make your own, or <Link href={`/klab/token?id=${taken}`}><Zt>{`see K1N0 #${taken}`}</Zt></Link>.</p>}
      {check.changes.length > 0 && (
        <>
          <ul className="mcheck__list">{check.changes.map(c => <li key={c}>{c}</li>)}</ul>
          <button type="button" className="lab-btn lab-btn--sm" onClick={() => set(mintReady(design))}>Make it mint-ready</button>
        </>
      )}
      {check.notMinted.length > 0 && (
        <p className="lab-note"><Zt>{`${check.notMinted.join(', ')}: not part of the mint. After minting, give your K1N0 a look on its page: an effect for each colour (glow, pulse, float, neon, metal…), the speed and the view.`}</Zt></p>
      )}
      <div className="lab-row">
        <MintButton />
        <span className="lab-note">{note ?? `Optional · ${MINT_PRICE_ETH} ETH · ${design.look ? 'its look comes with it' : 'the 3D view comes with it'}`}</span>
      </div>
    </div>
  )
}

export default function MintDialog({ onClose }: { onClose: () => void }) {
  const { design } = useLab()
  const ref = useRef<HTMLDialogElement>(null)
  const start = useMemo(() => coloursFromDesign(design), [design])
  const [colours, setColours] = useState<Colours>(start.colours)
  // the title starts from the name the visitor gave their K (not the Lab's default names)
  const [rawTitle, setRawTitle] = useState(() => (isDefaultName(design.name) ? '' : cleanName(design.name)))
  const title = cleanName(rawTitle)
  const titleBad = hasArtistName(title) // the artist's name is reserved
  const valid = validColours(colours)
  const nowColours = useRef(colours) // answers about older colours are dropped
  nowColours.current = colours
  const recheck = (onError: () => void = () => undefined) => {
    const c = colours
    if (validColours(c)) coloursTaken(c).then(n => { if (nowColours.current === c) setTaken(n) }, onError)
  }
  const look = useMemo(() => lookFromDesign(design), [design]) // the 3D view the design was framed in
  const data = useMemo(() => dataHex(colours, look, 1, title), [colours, look, title])

  const [state, setState] = useState<MintState | null>(null)
  const [taken, setTaken] = useState<number | false | null>(null) // false free, n = K1N0 #n, null = unknown
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [account, setAccount] = useState<WalletInfo | null>(null)
  const [phase, setPhase] = useState<Phase>('check')
  const [error, setError] = useState('')
  const [netError, setNetError] = useState(false)
  const [hash, setHash] = useState('')
  const [minted, setMinted] = useState(0)
  const abort = useRef<AbortController | null>(null)
  const typed = useRef(false)

  // the number: a free one at random, or the one the visitor types
  const [free, setFree] = useState<number[] | null>(null)
  const [numText, setNumText] = useState('')
  const num = Number(numText)
  const numValid = Number.isInteger(num) && num >= 1 && num <= MAX_SUPPLY
  const freeSet = useMemo(() => (free ? new Set(free) : null), [free])
  const numFree = numValid && (!freeSet || freeSet.has(num))
  const random = () => {
    const p = free ?? Array.from({ length: MAX_SUPPLY }, (_, i) => i + 1)
    if (p.length) setNumText(String(p[Math.floor(Math.random() * p.length)]))
  }
  const refreshFree = (pickNew: boolean) => freeNumbers().then(f => {
    setFree(f)
    if (pickNew && !typed.current && f.length) setNumText(String(f[Math.floor(Math.random() * f.length)]))
  }, () => setNetError(true))
  const readChain = () => {
    setNetError(false)
    readMintState().then(setState, () => setNetError(true))
    refreshFree(true)
  }

  useEffect(() => {
    const d = ref.current
    d?.showModal()
    const stop = discoverWallets(setWallets)
    random()
    if (KLAB.live) readChain()
    return () => { stop(); abort.current?.abort(); d?.close() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // are these four colours still free?
  useEffect(() => {
    setTaken(null)
    if (!KLAB.live || !valid) return
    let alive = true
    const t = setTimeout(() => coloursTaken(colours).then(n => { if (alive) setTaken(n) }, () => { if (alive) setNetError(true) }), 250)
    return () => { alive = false; clearTimeout(t) }
  }, [colours, valid])

  const busy = phase === 'connecting' || phase === 'signing' || phase === 'pending'
  const ready = KLAB.live && valid && !titleBad && taken === false && !!state?.open && numFree && !!free

  const follow = async (h: string) => {
    setError('')
    setPhase('pending')
    abort.current = new AbortController()
    try {
      setMinted(await waitMinted(h, abort.current.signal))
      setPhase('done')
    } catch (e) {
      const failed = /failed on-chain/.test(explain(e))
      setError(failed ? 'The transaction failed on-chain: nothing was minted (only the gas was spent). Check the colours and the number, then try again.' : `${explain(e)} Your transaction was sent: check it on Etherscan before minting again.`)
      if (failed) { setPhase('check'); refreshFree(false); recheck() }
    }
  }

  const mintWith = async (w: WalletInfo) => {
    setError('')
    if (!ready) return // colours, number or title changed since: the checks must pass again first
    try {
      setPhase('connecting')
      const addr = await connect(w.provider) // every time: the account in the wallet may have changed
      setAccount(w)
      await ensureChain(w.provider)
      const fresh = await readMintState() // the current price
      setState(fresh)
      if (state && fresh.price !== state.price) {
        // never charge a price the visitor has not seen on the button
        setError(`The price is now ${eth(fresh.price)}. Press the button again to mint at this price.`)
        setPhase('check')
        return
      }
      setPhase('signing')
      const h = await sendMint(w.provider, addr, colours, title, look, num, fresh.price)
      setHash(h)
      await follow(h)
    } catch (e) {
      setError(explain(e))
      setPhase('check')
      recheck()
      refreshFree(/just taken/.test(explain(e)))
    }
  }

  const primary = () => {
    if (wallets.length === 1) return mintWith(wallets[0])
    if (account) return mintWith(account)
    setPhase('pick')
  }

  const label =
    phase === 'connecting' ? 'Connecting…'
      : phase === 'signing' ? 'Confirm in your wallet…'
        : phase === 'pending' ? 'Minting…'
          : !KLAB.live ? 'Mint opens soon'
            : state && !state.open ? 'Mint opens soon'
              : wallets.length === 0 ? 'Mint (needs a wallet)'
                : `Mint for ${state ? eth(state.price) : '…'}`

  const setSlot = (slot: number, v: number) => setColours(c => { const n = [...c] as Colours; n[slot] = v; return n })
  const carry = `#k1n0=${data.slice(2, 10)}`
  const shareText = encodeURIComponent(`My K1N0 #${minted} from THE K.LAB by @OsayKancuno: four colours that are mine, fully on-chain, and a look I can keep changing.`)
  const shareUrl = encodeURIComponent(`https://www.kancuno.com/klab/token?id=${minted}`)

  return (
    // Closing is always possible: a transaction already sent goes on in the wallet
    <dialog ref={ref} className="mint" aria-labelledby="mint-title" onCancel={onClose}>
      <div className="mint__head">
        <h2 id="mint-title" className="mint__title"><Zt>{phase === 'done' ? `K1N0 #${minted} is yours` : 'Mint this K1N0'}</Zt></h2>
        <button type="button" className="mint__x" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="mint__body">
        <figure className="mint__art">
          <K1N0Piece data={data} label="Your K1N0 in 3D: drag to turn it" className="k1-piece mint__piece" />
          <figcaption className="lab-label">Your K1N0, as the NFT shows it · drag it</figcaption>
        </figure>

        <div className="mint__side">
          {phase === 'done' ? (
            <div className="mint__done">
              <p className="mint__big">These colours are yours. Now give it a look: an effect for each colour, changeable whenever you like.</p>
              <div className="lab-row">
                <Link className="lab-btn lab-btn--primary" href={`/klab/token?id=${minted}`} onClick={onClose}>Give it a look</Link>
                <a className="lab-btn" href={`https://x.com/intent/post?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer">Share on X</a>
                <a className="lab-btn lab-btn--ghost" href={tokenMarketUrl(minted)} target="_blank" rel="noopener noreferrer">OpenSea</a>
              </div>
              <a className="lab-note" href={txUrl(hash)} target="_blank" rel="noopener noreferrer">Transaction on Etherscan ↗</a>
            </div>
          ) : (
            <>
              <ol className="mint__steps">
                <li data-ok={valid || undefined} data-bad={!valid || undefined}>
                  <strong>Four colours</strong>
                  <span>The X and four blocks of the head always stay black; these four colours are yours. <Zt>{start.exact ? 'From your design:' : 'Your design, in the K1N0 palette:'}</Zt></span>
                  <div className="k1-slots">
                    {SLOTS.map((name, slot) => (
                      <div key={name} className="k1-slot" role="radiogroup" aria-label={`${name} colour`}
                        onKeyDown={e => {
                          // arrows move through the colours this slot can take (one tab stop per slot)
                          const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
                          if (!step) return
                          e.preventDefault()
                          let i = colours[slot]
                          do i = (i + step + 16) % 16; while (slot === 0 ? i === INK : i === colours[0])
                          setSlot(slot, i)
                          const btn = e.currentTarget.querySelectorAll('button')[i] as HTMLButtonElement | undefined
                          btn?.focus()
                        }}>
                        <span className="k1-slot__name">{name}</span>
                        <span className="k1-slot__swatches">
                          {K1N0.map((hex, i) => {
                            const off = slot === 0 ? i === INK : i === colours[0]
                            return (
                              <button
                                key={hex} type="button" role="radio" aria-checked={colours[slot] === i} aria-label={NAMES[i]} title={NAMES[i]}
                                tabIndex={colours[slot] === i ? 0 : -1}
                                className="k1-sw" style={{ background: hex }} disabled={off || busy} onClick={() => setSlot(slot, i)}
                              />
                            )
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!valid && <span>The background cannot be black, and the coloured blocks need colours apart from the background.</span>}
                </li>
                <li data-ok={taken === false || undefined} data-bad={typeof taken === 'number' || undefined}>
                  <strong>Yours alone</strong>
                  {!valid ? <span>Checked once the colours work.</span>
                    : !KLAB.live ? <span>When the mint opens, the Lab checks that nobody owns these four colours yet.</span>
                      : taken === null ? <span>Checking these colours…</span>
                        : taken === false ? <span>Free. Mint them and they are yours: nobody can mint these four colours again.</span>
                          : <span>Already <Link href={`/klab/token?id=${taken}`} onClick={onClose}><Zt>{`K1N0 #${taken}`}</Zt></Link>. Change one colour to make your own.</span>}
                </li>
                <li data-ok={(numFree && !!free) || undefined} data-bad={(numValid && !numFree) || undefined}>
                  <strong>Your number</strong>
                  <span className="mint__num">
                    <label htmlFor="mint-num"><Zt>K1N0 #</Zt></label>
                    <input
                      id="mint-num" inputMode="numeric" autoComplete="off" value={numText} disabled={busy} aria-describedby="mint-num-note"
                      onChange={e => { typed.current = true; setNumText(e.target.value.replace(/\D/g, '').slice(0, 4)) }}
                    />
                    <button type="button" className="lab-btn lab-btn--sm" onClick={() => { typed.current = true; random() }} disabled={busy}>Random</button>
                  </span>
                  <span id="mint-num-note">
                    {!numValid ? `Pick a number from 1 to ${MAX_SUPPLY.toLocaleString('en')}.`
                      : !free ? (KLAB.live ? 'Checking which numbers are free…' : 'Pick the number you like, or let Random choose.')
                        : numFree ? `#${num} is free.` : `#${num} is taken. Try another, or press Random.`}
                  </span>
                </li>
                <li>
                  <strong>Title</strong>
                  <input className="k1-title" value={rawTitle} maxLength={32} disabled={busy} aria-label="Title of your K1N0 (optional)"
                    onChange={e => setRawTitle(e.target.value)} placeholder="Optional" aria-invalid={titleBad} />
                  {titleBad && <span>This title is reserved. Pick another one.</span>}
                </li>
                <li>
                  <strong>Price</strong>
                  <span>{state ? `${eth(state.price)} + gas · ${state.supply.toLocaleString('en')} of ${MAX_SUPPLY.toLocaleString('en')} minted` : `${MAX_SUPPLY.toLocaleString('en')} K1N0 in all, fully on-chain on Ethereum.`}</span>
                </li>
              </ol>

              {phase === 'pick' && (
                <div className="mint__wallets" role="group" aria-label="Choose a wallet">
                  {wallets.map(w => (
                    <button key={w.id} type="button" className="lab-btn" onClick={() => mintWith(w)} disabled={!ready}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {w.icon && <img src={w.icon} alt="" width={18} height={18} />} {w.name}
                    </button>
                  ))}
                </div>
              )}

              <button type="button" className="lab-btn lab-btn--primary mint__go" onClick={primary} disabled={!ready || busy || wallets.length === 0}>
                {busy && <span className="mint__spin" aria-hidden="true" />}{label}
              </button>

              {KLAB.live && wallets.length === 0 && (
                <p className="lab-note">
                  To mint you need an Ethereum wallet: <a href="https://rabby.io/" target="_blank" rel="noopener noreferrer">Rabby</a>, <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">MetaMask</a>, <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">Coinbase Wallet</a> or <a href="https://rainbow.me/" target="_blank" rel="noopener noreferrer">Rainbow</a>.
                  On a phone, open this page in your wallet app: <a href={`https://metamask.app.link/dapp/www.kancuno.com/klab/editor${carry}`}>MetaMask</a> · <a href={`https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(`https://www.kancuno.com/klab/editor${carry}`)}`}>Coinbase</a>. Your colours come along.
                </p>
              )}
              {phase === 'pending' && (
                <p className="lab-note">
                  <a href={txUrl(hash)} target="_blank" rel="noopener noreferrer">Follow it on Etherscan ↗</a> · it usually takes under a minute.
                  {error && <> <button type="button" className="lab-btn lab-btn--sm" onClick={() => follow(hash)}>Check again</button></>}
                </p>
              )}
              {netError && phase === 'check' && (
                <p className="lab-error" role="alert">
                  Ethereum could not be read right now. <button type="button" className="lab-btn lab-btn--sm" onClick={() => { readChain(); recheck(() => setNetError(true)) }}>Retry</button>
                </p>
              )}
              {error && <p className="lab-error" role="alert">{error}</p>}
              <p className="lab-status" role="status">
                {phase === 'connecting' ? 'Connecting to your wallet…'
                  : phase === 'signing' ? 'Your wallet shows the price and the gas. Nothing moves until you confirm.'
                    : phase === 'pending' && !error ? 'Minting your K1N0: waiting for the block.' : ''}
              </p>

              <details className="mint__more">
                <summary>What you get</summary>
                <ul>
                  <li>A <Zt>K1N0</Zt> in your four colours, fixed forever and drawn by the contract: a 3D image and an interactive 3D piece you can turn, no IPFS, no server.</li>
                  <li>A living look: after the mint, give each colour an effect (glow, pulse, float, neon, metal…), set the speed and the view. The colours never change. Each new look costs only gas, shows on-chain and on OpenSea, and stays in its story with your name on it.</li>
                  <li>When it changes hands, its story goes on: the next holder adds their looks.</li>
                  {KLAB.live && <li><a href={contractUrl()} target="_blank" rel="noopener noreferrer">The contract on Etherscan ↗</a></li>}
                </ul>
              </details>
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}
