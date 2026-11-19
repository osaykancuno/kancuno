// THE K.LAB on Ethereum: contract config, public reads (JSON-RPC) and the visitor's wallet
// (EIP-1193 / EIP-6963). No web3 library: a handful of calls, hand-encoded, keeps the Lab light.
import { coloursHex, encodeLook, toHex, type Colours, type Look } from './onchain'

const ENV_CHAIN = Number(process.env.NEXT_PUBLIC_KLAB_CHAIN_ID || 1)
const ENV_ADDRESS = (process.env.NEXT_PUBLIC_KLAB_ADDRESS || '').toLowerCase()

const CHAINS: Record<number, { name: string; hex: string; explorer: string; opensea: string; rpcs: string[] }> = {
  1: {
    name: 'Ethereum',
    hex: '0x1',
    explorer: 'https://etherscan.io',
    opensea: 'https://opensea.io/assets/ethereum',
    rpcs: ['https://ethereum-rpc.publicnode.com', 'https://cloudflare-eth.com', 'https://eth.llamarpc.com'],
  },
  31337: {
    // a local Hardhat node, for testing the whole flow (NEXT_PUBLIC_KLAB_CHAIN_ID=31337)
    name: 'Local test chain',
    hex: '0x7a69',
    explorer: 'http://127.0.0.1:8545',
    opensea: 'http://127.0.0.1:8545',
    rpcs: ['http://127.0.0.1:8545'],
  },
  11155111: {
    name: 'Sepolia (test)',
    hex: '0xaa36a7',
    explorer: 'https://sepolia.etherscan.io',
    opensea: 'https://testnets.opensea.io/assets/sepolia',
    rpcs: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://rpc.sepolia.org'],
  },
}

// The KLab contract. Empty until it is deployed: the Lab then shows "Mint opens soon".
// After the deploy, put its address here (or in NEXT_PUBLIC_KLAB_ADDRESS).
const DEPLOYED: Record<number, string> = {
  1: '0x25c8518e54b7cbb6cfe16d11bda5d543fb9e397f', // THE K.LAB (K1N0), deployed 2026-11-18; v1 (0x7d4bcc60eea0d7162dd127fcafcf4cc3795c4dc3) is closed and retired
  11155111: '0x0e8ae80b24eb212fc9e7232f53fb726af561dfd9', // test deployment of v2 with extensions (2026-11-18, before the K1N0 rename), owner: a throwaway test wallet
}

export const KLAB = {
  chainId: ENV_CHAIN in CHAINS ? ENV_CHAIN : 1,
  get chain() { return CHAINS[this.chainId] },
  get address(): string { return /^0x[0-9a-f]{40}$/.test(ENV_ADDRESS) ? ENV_ADDRESS : (DEPLOYED[this.chainId] || '').toLowerCase() },
  get live(): boolean { return /^0x[0-9a-f]{40}$/.test(this.address) },
}
export const txUrl = (hash: string) => `${KLAB.chain.explorer}/tx/${hash}`
export const tokenMarketUrl = (id: number | bigint) => `${KLAB.chain.opensea}/${KLAB.address}/${id}`
export const contractUrl = () => `${KLAB.chain.explorer}/address/${KLAB.address}`

// ── ABI (only what the Lab needs) ─────────────────────────────────────────
const SEL = {
  mint: 'c65f1d85', coloursTaken: '77040ad5', usedMap: '12ac3626', tokenURI: 'c87b56dd', dataOf: '871caa98',
  looksCount: '2832dfd0', lookAt: '3593cd58', setLook: 'c4f6a629', totalSupply: '18160ddd', price: 'a035b1fe',
  mintOpen: '24bbd049', ownerOf: '6352211e', isLookOperator: '39c9b1bf', balanceOf: '70a08231',
}
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const ERRORS: Record<string, string> = {
  '0x589ed34b': 'The mint is not open yet.',
  '0xf7760f25': 'The price changed. Try again.',
  '0x1f5439a9': 'K1N0 numbers go from 1 to 8,362.',
  '0x9ada7a4c': 'That number was just taken. Pick another one, or press Random.',
  '0xe26a2851': 'These colours were just minted by someone else. Change one colour to make your own.',
  '0xf9103a88': 'These colours do not make a K1N0: the background cannot be black, and the head needs colours apart from it.',
  '0x32f207a2': 'This look is not valid.',
  '0xd4f81c0a': 'The title can use letters, digits, spaces and - _ . \' ! # (32 at most); some names are reserved.',
  '0x79d93f49': 'This K1N0 does not exist.',
  '0xea8e4eb5': 'Only the holder of this K1N0 (or an app they chose) can change its look.',
}

const word = (n: bigint | number) => BigInt(n).toString(16).padStart(64, '0')
const left = (hex: string) => hex.replace(/^0x/, '').padEnd(64, '0') // bytesN, left-aligned
const encUint = (sel: string, n: number | bigint) => '0x' + sel + word(n)
const utf = (t: string) => Array.from(new TextEncoder().encode(t), v => v.toString(16).padStart(2, '0')).join('')
// mint(bytes4 colours, string title, bytes8 look, uint256 id)
function encMint(c: Colours, title: string, look: Look, id: number): string {
  const t = utf(title)
  return '0x' + SEL.mint + left(coloursHex(c)) + word(128) + left(encodeLook(look)) + word(id) +
    word(t.length / 2) + t.padEnd(Math.ceil(t.length / 64) * 64, '0')
}
const decUint = (h: string, i = 0) => BigInt('0x' + (h.slice(2 + i * 64, 66 + i * 64) || '0'))
function decBytes(h: string): Uint8Array {
  const s = h.slice(2)
  const off = Number(BigInt('0x' + s.slice(0, 64))) * 2
  const len = Number(BigInt('0x' + s.slice(off, off + 64)))
  const data = s.slice(off + 64, off + 64 + len * 2)
  return Uint8Array.from(data.match(/.{2}/g) ?? [], x => parseInt(x, 16))
}
const decString = (h: string) => new TextDecoder().decode(decBytes(h))

// ── Public reads, through public RPCs (the visitor needs no wallet to look) ─
let rpcId = 0
export async function rpc<T = string>(method: string, params: unknown[]): Promise<T> {
  let last: unknown
  for (const url of KLAB.chain.rpcs) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }) })
      const j = await r.json()
      if (j.error) throw Object.assign(new Error(j.error.message), { data: j.error.data })
      return j.result as T
    } catch (e) {
      last = e
      // a revert (an error selector) is an answer, not a network problem; anything else: next RPC
      const d = (e as { data?: unknown }).data
      if (typeof d === 'string' && /^0x[0-9a-f]{8}/i.test(d)) throw e
    }
  }
  throw last instanceof Error ? last : new Error('The network is not reachable.')
}
const call = (data: string) => rpc('eth_call', [{ to: KLAB.address, data }, 'latest'])

export interface MintState { price: bigint; supply: number; open: boolean }
export async function readMintState(): Promise<MintState> {
  const [p, s, o] = await Promise.all([call('0x' + SEL.price), call('0x' + SEL.totalSupply), call('0x' + SEL.mintOpen)])
  return { price: decUint(p), supply: Number(decUint(s)), open: decUint(o) === BigInt(1) }
}
/** 0 when these colours are free, else the K1N0 that has them */
export async function coloursTaken(c: Colours): Promise<number | 0> {
  const h = await call('0x' + SEL.coloursTaken + left(coloursHex(c)))
  return decUint(h, 0) === BigInt(1) ? Number(decUint(h, 1)) : 0
}
// usedMap() is a uint256[] of about 33 words (8,363 bits): never trust a bigger length from an RPC
const usedWords = (h: string) => Math.min(Number(BigInt('0x' + h.slice(64, 128))), 40)

// The numbers still free (1..8362), from the contract's map of used ones (one call)
export async function freeNumbers(): Promise<number[]> {
  const h = (await call('0x' + SEL.usedMap)).slice(2)
  const n = usedWords(h)
  const used = new Set<number>()
  for (let i = 0; i < n; i++) {
    const w = BigInt('0x' + h.slice(128 + i * 64, 192 + i * 64))
    if (w === BigInt(0)) continue
    for (let b = 0; b < 256; b++) if ((w >> BigInt(b)) & BigInt(1)) used.add(i * 256 + b)
  }
  const free: number[] = []
  for (let id = 1; id <= 8362; id++) if (!used.has(id)) free.push(id)
  return free
}

/** Whether K1N0 #id was minted, from the map of used numbers (no revert data needed) */
export async function isMinted(id: number): Promise<boolean> {
  const h = (await call('0x' + SEL.usedMap)).slice(2)
  const w = id >> 8
  if (w >= usedWords(h)) return false
  return ((BigInt('0x' + h.slice(128 + w * 64, 192 + w * 64)) >> BigInt(id & 255)) & BigInt(1)) === BigInt(1)
}

/** Every minted number, #0 included, from the contract's map of used ones (one call) */
export async function mintedNumbers(): Promise<number[]> {
  const h = (await call('0x' + SEL.usedMap)).slice(2)
  const n = usedWords(h)
  const ids: number[] = []
  for (let i = 0; i < n; i++) {
    const w = BigInt('0x' + h.slice(128 + i * 64, 192 + i * 64))
    if (w === BigInt(0)) continue
    for (let b = 0; b < 256; b++) if ((w >> BigInt(b)) & BigInt(1)) ids.push(i * 256 + b)
  }
  if (!ids.includes(0)) ids.unshift(0) // #0 is minted with the contract
  return ids
}

/** The K1N0 held by `who`: balanceOf says how many, then ownerOf over the minted numbers,
 *  a few at a time, stopping as soon as all of them are found. */
export async function ownedBy(who: string, onFound?: (ids: number[]) => void): Promise<number[]> {
  const me = who.toLowerCase()
  const total = Number(decUint(await call('0x' + SEL.balanceOf + word(BigInt(me)))))
  if (!total) return []
  const ids = await mintedNumbers()
  const found: number[] = []
  for (let i = 0; i < ids.length && found.length < total; i += 8) {
    const batch = ids.slice(i, i + 8)
    // every number in the map is minted, so ownerOf never reverts here: any error is the network,
    // and it must surface rather than silently drop a piece
    const owners = await Promise.all(batch.map(id => call(encUint(SEL.ownerOf, id))))
    owners.forEach((o, j) => { if (o.length >= 66 && '0x' + o.slice(-40).toLowerCase() === me) found.push(batch[j]) })
    onFound?.([...found])
  }
  return found
}

/** KLab.dataOf: colours (4) · look (8) · looks (2) · title — what the image and the 3D piece draw */
export async function dataOf(id: number): Promise<string> {
  return toHex(decBytes(await call(encUint(SEL.dataOf, id))))
}
export async function ownerOf(id: number): Promise<string> {
  return '0x' + (await call(encUint(SEL.ownerOf, id))).slice(26)
}
export async function tokenMeta(id: number): Promise<{ name: string; description: string; image: string; attributes: { trait_type: string; value: string | number }[] }> {
  const uri = decString(await call(encUint(SEL.tokenURI, id)))
  const b64 = uri.slice(uri.indexOf(',') + 1)
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0))))
}
export interface LookEntry { n: number; look: string; by: string; time: number }
export const HISTORY_SHOWN = 40
/** The latest looks of a K1N0 (up to HISTORY_SHOWN), oldest first: the look, who set it, when.
 * Read a few at a time so public RPCs are not flooded; `n` is the look's number in its whole story. */
export async function lookHistory(id: number): Promise<LookEntry[]> {
  const count = Number(decUint(await call(encUint(SEL.looksCount, id))))
  const first = Math.max(1, count - HISTORY_SHOWN + 1)
  const rows: LookEntry[] = []
  for (let n = first; n <= count; n += 8) {
    const batch = Array.from({ length: Math.min(8, count - n + 1) }, (_, i) => n + i)
    rows.push(...(await Promise.all(batch.map(v =>
      call('0x' + SEL.lookAt + word(id) + word(v)).then(h => ({
        n: v,
        look: '0x' + h.slice(2, 18),
        by: '0x' + h.slice(2 + 64 + 24, 2 + 128),
        time: Number(decUint(h, 2)),
      }))))))
  }
  return rows
}
/** How many looks in all (the last row's number) */
export const looksTotal = (h: LookEntry[]) => (h.length ? h[h.length - 1].n : 0)
/** May this address change the look of K1N0 #id? (the holder, or an app the holder made a look operator) */
export async function canSetLook(id: number, who: string): Promise<boolean> {
  const o = (await ownerOf(id)).toLowerCase()
  if (o === who.toLowerCase()) return true
  const op = await call('0x' + SEL.isLookOperator + word(BigInt(o)) + word(BigInt(who)))
  return decUint(op) === BigInt(1)
}

// ── Wallets (EIP-6963: every installed wallet announces itself) ───────────
export interface Eip1193 { request(a: { method: string; params?: unknown[] }): Promise<unknown> }
export interface WalletInfo { id: string; name: string; icon: string; provider: Eip1193 }

export function discoverWallets(onChange: (w: WalletInfo[]) => void): () => void {
  const found = new Map<string, WalletInfo>()
  const emit = () => onChange([...found.values()])
  const onAnnounce = (e: Event) => {
    const d = (e as CustomEvent).detail as { info: { uuid: string; name: string; icon: string; rdns: string }; provider: Eip1193 }
    if (!d?.info || !d.provider) return
    found.delete('injected') // a late announcement replaces the window.ethereum fallback
    found.set(d.info.rdns || d.info.uuid, { id: d.info.rdns || d.info.uuid, name: d.info.name, icon: d.info.icon, provider: d.provider })
    emit()
  }
  window.addEventListener('eip6963:announceProvider', onAnnounce)
  window.dispatchEvent(new Event('eip6963:requestProvider'))
  // older wallets only inject window.ethereum
  const t = setTimeout(() => {
    const eth = (window as unknown as { ethereum?: Eip1193 & { isMetaMask?: boolean } }).ethereum
    if (!found.size && eth) { found.set('injected', { id: 'injected', name: eth.isMetaMask ? 'MetaMask' : 'Browser wallet', icon: '', provider: eth }); emit() }
  }, 350)
  return () => { clearTimeout(t); window.removeEventListener('eip6963:announceProvider', onAnnounce) }
}

export async function connect(w: Eip1193): Promise<string> {
  const accounts = (await w.request({ method: 'eth_requestAccounts' })) as string[]
  if (!accounts?.length) throw new Error('No account was shared.')
  return accounts[0].toLowerCase()
}

export async function ensureChain(w: Eip1193) {
  const id = (await w.request({ method: 'eth_chainId' })) as string
  if (parseInt(id, 16) === KLAB.chainId) return
  try {
    await w.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: KLAB.chain.hex }] })
  } catch {
    throw new Error(`Switch your wallet to ${KLAB.chain.name} and try again.`)
  }
  // some wallets accept the switch but stay where they were: never send on another chain
  const now = (await w.request({ method: 'eth_chainId' })) as string
  if (parseInt(now, 16) !== KLAB.chainId) throw new Error(`Switch your wallet to ${KLAB.chain.name} and try again.`)
}

async function send(w: Eip1193, tx: { from: string; to: string; data: string; value?: string }): Promise<string> {
  // a dry run first: a clear reason instead of a failed transaction
  try {
    await rpc('eth_call', [tx, 'latest'])
  } catch (e) {
    throw Object.assign(new Error(explain(e)), { explained: true })
  }
  return (await w.request({ method: 'eth_sendTransaction', params: [tx] })) as string
}
export const sendMint = (w: Eip1193, from: string, c: Colours, title: string, look: Look, id: number, price: bigint) =>
  send(w, { from, to: KLAB.address, data: encMint(c, title, look, id), value: '0x' + price.toString(16) })
export const sendLook = (w: Eip1193, from: string, id: number, look: Look) =>
  send(w, { from, to: KLAB.address, data: '0x' + SEL.setLook + word(id) + left(encodeLook(look)) })

/** Waits for any transaction to be mined (true when it succeeded) */
export async function waitTx(hash: string, signal?: AbortSignal): Promise<{ logs: { address: string; topics: string[] }[] }> {
  for (let i = 0; i < 600; i++) {
    if (signal?.aborted) throw new Error('Stopped waiting.')
    const r = await rpc<{ status: string; logs: { address: string; topics: string[] }[] } | null>('eth_getTransactionReceipt', [hash]).catch(() => null)
    if (r) {
      if (r.status !== '0x1') throw new Error('The transaction failed on-chain.')
      return r
    }
    await new Promise(res => setTimeout(res, 3000))
  }
  throw new Error('Still pending. Check it on Etherscan.')
}

// Waits for the transaction; returns the new token id
export async function waitMinted(hash: string, signal?: AbortSignal): Promise<number> {
  const r = await waitTx(hash, signal)
  const log = r.logs.find(l => l.address.toLowerCase() === KLAB.address && l.topics[0] === TRANSFER)
  if (!log) throw new Error('Minted, but the token id was not found.')
  return Number(BigInt(log.topics[3]))
}

// Human words for wallet and contract errors
export function explain(e: unknown): string {
  const err = e as { code?: number; message?: string; explained?: boolean; data?: string | { data?: string; originalError?: { data?: string } } }
  if (err?.explained && err.message) return err.message // already in plain words
  if (err?.code === 4001) return 'You cancelled in your wallet. Nothing changed.'
  const data = typeof err?.data === 'string' ? err.data : err?.data?.data ?? err?.data?.originalError?.data
  if (data && ERRORS[data.slice(0, 10)]) {
    if (data.startsWith('0xe26a2851')) return `These colours are already K1N0 #${Number(BigInt('0x' + data.slice(10, 74)))}. Change one colour to make your own.`
    return ERRORS[data.slice(0, 10)]
  }
  const m = err?.message ?? ''
  if (/insufficient funds/i.test(m)) return 'Not enough ETH in this wallet for the price and the gas.'
  if (/user rejected|denied/i.test(m)) return 'You cancelled in your wallet. Nothing changed.'
  return m ? m.replace(/^.*?:\s*/, '').slice(0, 160) : 'Something went wrong. Nothing changed.'
}

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`
export const eth = (wei: bigint) => {
  const s = (Number(wei) / 1e18).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  return `${s} ETH`
}
