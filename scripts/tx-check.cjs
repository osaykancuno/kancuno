// Transaction-safety check for THE K.LAB: runs the site's real encoders and send paths against the
// live K1N0 contract on Ethereum mainnet with eth_call only (a fake wallet records the transaction
// instead of sending it). Nothing is signed or sent. Run: node scripts/tx-check.cjs
const fs = require('fs')
const path = require('path')
const os = require('os')
const PROJECT = process.argv[2] || path.join(__dirname, '..')
const ts = require(path.join(PROJECT, 'node_modules', 'typescript'))
const OUT = path.join(os.tmpdir(), 'klab-tx-check')
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'package.json'), '{"type":"commonjs"}')
for (const f of ['onchain', 'chain', 'design', 'base', 'orbit']) {
  const src = fs.readFileSync(path.join(PROJECT, 'src/lib/lab', f + '.ts'), 'utf8')
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  fs.writeFileSync(path.join(OUT, f + '.js'), js)
}
const oc = require(path.join(OUT, 'onchain.js'))
const ch = require(path.join(OUT, 'chain.js'))
const de = require(path.join(OUT, 'design.js'))

let pass = 0, fail = 0
const ok = (cond, name, extra = '') => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra) } }
const OWNER = '0x41b199a5194c58b29559a482e919331e1c8eef85' // holder of K1N0 #0 (public)
const RICH = '0x28c6c06298d514db089934071355e5743bf21d60' // a public address with ETH, so a paid eth_call can run
const NOBODY = '0x000000000000000000000000000000000000dead'

function fakeWallet() {
  const sent = []
  return {
    sent,
    provider: {
      async request({ method, params }) {
        if (method === 'eth_chainId') return '0x1'
        if (method === 'eth_sendTransaction') { sent.push(params[0]); return '0x' + 'ab'.repeat(32) }
        throw new Error('unexpected ' + method)
      },
    },
  }
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

;(async () => {
  console.log('contract', ch.KLAB.address, 'chain', ch.KLAB.chainId)
  ok(ch.KLAB.chainId === 1 && ch.KLAB.address === '0x25c8518e54b7cbb6cfe16d11bda5d543fb9e397f', 'mainnet contract address')

  // ── A. pure codec checks ──
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
  for (let i = 0; i < 5000; i++) {
    const l = { fx: [rnd(0, 8), rnd(0, 8), rnd(0, 8), rnd(0, 8)], speed: rnd(0, 3), yaw: rnd(-90, 89) * 2, pitch: rnd(20, 89), zoom: rnd(60, 190) }
    const back = oc.decodeLook(oc.encodeLook(l))
    if (JSON.stringify(back) !== JSON.stringify(l)) { ok(false, 'look roundtrip', JSON.stringify(l) + ' -> ' + JSON.stringify(back)); break }
  }
  pass++
  const edgeCams = [{ yaw: -180, pitch: 74, zoom: 1 }, { yaw: 179.9, pitch: 74, zoom: 1 }, { yaw: 360, pitch: 10, zoom: 0.2 }, { yaw: -721, pitch: 95, zoom: 5 },
    { yaw: NaN, pitch: 74, zoom: 1 }, { yaw: 33.3, pitch: 47.6, zoom: 1.234 }, { yaw: 177, pitch: 20, zoom: 0.6 }]
  const edgeLooks = edgeCams.map(cam => oc.lookFromDesign({ ...de.defaultDesign(), look: null, view: '3d', cam }))
  // K1N0 mode: the design's own look is what it mints with
  ok(JSON.stringify(oc.lookFromDesign(de.defaultDesign())) === JSON.stringify(de.ORIGINAL_LOOK), 'K1N0 mode mints its own look')
  ok(oc.mintCheck(de.defaultDesign()).changes.length === 0 && oc.mintCheck(de.defaultDesign()).problems.length === 0, 'the starting design is mint-ready')
  for (const l of edgeLooks) {
    const valid = l.fx.every(v => v === 0) && l.speed === 1 && l.yaw >= -180 && l.yaw <= 178 && l.yaw % 2 === 0 && l.pitch >= 20 && l.pitch <= 89 && l.zoom >= 60 && l.zoom <= 190
    ok(valid, 'lookFromDesign in range', JSON.stringify(l))
    ok(JSON.stringify(oc.decodeLook(oc.encodeLook(l))) === JSON.stringify(l), 'lookFromDesign roundtrip', JSON.stringify(l))
  }
  for (const p of de.PRESETS) {
    const r = oc.mintReady(p)
    const c = oc.mintCheck(r)
    ok(c.changes.length === 0, `mintReady leaves no changes: ${p.name}`, JSON.stringify(c.changes))
    ok(JSON.stringify(oc.mintReady(r)) === JSON.stringify(r), `mintReady idempotent: ${p.name}`)
    ok(JSON.stringify(oc.coloursFromDesign(r).colours) === JSON.stringify(oc.coloursFromDesign(p).colours), `mintReady keeps the mint colours: ${p.name}`)
    // what the panel promises = what the dialog mints
    if (!c.problems.length) ok(oc.validColours(c.colours), `no problems => contract colour rule passes: ${p.name}`)
    else ok(!oc.validColours(c.colours), `problems <=> invalid colours: ${p.name}`)
  }
  for (const t of ['', 'A', "It's #1! a-b_c.d", 'x'.repeat(40), 'K4NCUN0', 'kancuno fan', 'émoji 🚀 ok']) {
    const c = oc.cleanName(t)
    ok(c.length <= 32 && /^[A-Za-z0-9 \-_.'!#]*$/.test(c), 'cleanName output allowed', JSON.stringify(c))
  }
  ok(oc.hasArtistName('K4NCUN0') && oc.hasArtistName('kancuno') && oc.hasArtistName('KANCUN0') && !oc.hasArtistName('K1N0'), 'artist name reserved')

  // ── B. live reads ──
  const state = await ch.readMintState()
  console.log('mint open:', state.open, 'price wei:', state.price.toString(), 'supply:', state.supply)
  const taken0 = await ch.coloursTaken(oc.LOGO_COLOURS)
  ok(taken0 === 0, '#0 colours reported as taken by #0 (not free)', String(taken0))
  ok(await ch.canSetLook(0, OWNER), 'holder may set the look of #0')
  ok(!(await ch.canSetLook(0, NOBODY)), 'a stranger may not set the look of #0')
  const owned = await ch.ownedBy(OWNER)
  ok(owned.includes(0), 'ownedBy finds #0 for its holder', JSON.stringify(owned))
  const free = await ch.freeNumbers()
  ok(free.length > 0 && !free.includes(0) && free.every(n => n >= 1 && n <= 8362), 'free numbers in 1..8362')
  for (const n of [0, ...owned]) ok(!free.includes(n), `minted #${n} is not offered as free`)

  // a free colour combination
  let colours
  for (let i = 0; i < 40 && !colours; i++) {
    const c = [rnd(0, 15), rnd(0, 15), rnd(0, 15), rnd(0, 15)]
    if (oc.validColours(c) && (await ch.coloursTaken(c)) === false) colours = c
  }
  ok(!!colours, 'found a free colour combination')

  // ── C. mint dry runs through the real send path ──
  const id = free[Math.floor(Math.random() * free.length)]
  const titles = ['', 'A', 'Neon K1N0', 'x'.repeat(32), "It's #1! a-b_c.d"]
  for (const [i, title] of titles.entries()) {
    const look = i % 2 ? edgeLooks[i % edgeLooks.length] : oc.LOOK_DEFAULT
    const w = fakeWallet()
    try {
      await ch.ensureChain(w.provider)
      await ch.sendMint(w.provider, RICH, colours, oc.cleanName(title), look, id, state.price)
      ok(state.open, `mint dry run passes (title ${JSON.stringify(title)})`)
      const tx = w.sent[0]
      ok(tx && tx.to === ch.KLAB.address, 'mint tx goes to the K1N0 contract')
      ok(tx && BigInt(tx.value) === state.price, 'mint tx value = live price')
      ok(tx && tx.data.startsWith('0xc65f1d85'), 'mint tx calls mint()')
      ok(tx && tx.from === RICH, 'mint tx from = connected account'); ok(tx && tx.chainId === '0x1', 'mint tx names mainnet')
    } catch (e) {
      const m = ch.explain(e)
      ok(!state.open && /not open/.test(m), `mint dry run (title ${JSON.stringify(title)})`, m)
      ok(w.sent.length === 0, 'nothing sent after a failed dry run')
    }
    await sleep(250)
  }
  // the planned K1N0 #1: THE K.LAB's mark (cream, pink, lime, lime), its look, from the owner, at the live price
  {
    const mark = oc.coloursFromDesign(de.defaultDesign()).colours
    ok(JSON.stringify(mark) === '[4,2,15,15]', 'the starting design is the mark (cream, pink, lime, lime)', JSON.stringify(mark))
    const free1 = !(await ch.isMinted(1)), freeMark = (await ch.coloursTaken(mark)) === false
    console.log('K1N0 #1 free:', free1, '· mark colours free:', freeMark)
    if (free1 && freeMark) {
      const w = fakeWallet()
      try {
        await ch.sendMint(w.provider, OWNER === RICH ? RICH : RICH, mark, oc.cleanName('THE K.LAB'), oc.lookFromDesign(de.defaultDesign()), 1, state.price)
        const tx = w.sent[0]
        ok(tx && tx.to === ch.KLAB.address && BigInt(tx.value) === state.price && state.price === 2400000000000000n, 'mint of #1 "THE K.LAB" passes at 0.0024 ETH')
      } catch (e) { ok(false, 'mint of #1 dry run', ch.explain(e)) }
    }
  }
  // must fail before anything reaches the wallet, with a clear reason
  const bad = [
    ['taken colours (#0)', () => [oc.LOGO_COLOURS, '', oc.LOOK_DEFAULT, id, state.price], /K1N0 #0|already|not open/],
    ['wrong price', () => [colours, '', oc.LOOK_DEFAULT, id, state.price - 1n], /price|not open/i],
    ['number 0', () => [colours, '', oc.LOOK_DEFAULT, 0, state.price], /1 to 8,362|not open/],
    ['number 8363', () => [colours, '', oc.LOOK_DEFAULT, 8363, state.price], /1 to 8,362|not open/],
    ['taken number', () => [colours, '', oc.LOOK_DEFAULT, owned.find(n => n > 0) ?? 0, state.price], /taken|1 to 8,362|not open/],
    ['reserved title', () => [colours, 'K4NCUN0', oc.LOOK_DEFAULT, id, state.price], /title|reserved|not open/i],
    ['black background', () => [[1, 2, 3, 4], '', oc.LOOK_DEFAULT, id, state.price], /black|not open/],
  ]
  for (const [name, args, re] of bad) {
    const w = fakeWallet()
    try {
      await ch.sendMint(w.provider, RICH, ...args())
      ok(false, `mint must fail: ${name}`)
    } catch (e) {
      const m = ch.explain(e)
      ok(re.test(m), `mint fails with a clear reason: ${name}`, m)
      ok(w.sent.length === 0, `nothing sent: ${name}`)
    }
    await sleep(250)
  }

  // ── D. setLook dry runs (holder of #0) ──
  const looks = [...edgeLooks, oc.LOOK_DEFAULT]
  for (let i = 0; i < 24; i++) looks.push({ fx: [rnd(0, 8), rnd(0, 8), rnd(0, 8), rnd(0, 8)], speed: rnd(0, 3), yaw: rnd(-90, 89) * 2, pitch: rnd(20, 89), zoom: rnd(60, 190) })
  looks.push({ fx: [8, 8, 8, 8], speed: 3, yaw: -180, pitch: 20, zoom: 60 }, { fx: [0, 0, 0, 0], speed: 0, yaw: 178, pitch: 89, zoom: 190 })
  for (const l of looks) {
    const w = fakeWallet()
    try {
      await ch.sendLook(w.provider, OWNER, 0, l)
      const tx = w.sent[0]
      ok(tx && tx.to === ch.KLAB.address && !tx.value && tx.data === '0xc4f6a629' + '0'.repeat(64) + oc.encodeLook(l).slice(2).padEnd(64, '0'), 'setLook tx exact', JSON.stringify(l))
    } catch (e) {
      ok(false, 'setLook dry run passes', JSON.stringify(l) + ' ' + ch.explain(e))
    }
    await sleep(200)
  }
  {
    const w = fakeWallet()
    try { await ch.sendLook(w.provider, NOBODY, 0, oc.LOOK_DEFAULT); ok(false, 'stranger setLook must fail') } catch (e) {
      ok(/holder/.test(ch.explain(e)), 'stranger setLook fails with a clear reason', ch.explain(e))
      ok(w.sent.length === 0, 'nothing sent for a stranger')
    }
  }
  // wrong chain: the wallet refuses to switch → nothing is sent
  {
    const sent = []
    const wrong = { async request({ method }) { if (method === 'eth_chainId') return '0xaa36a7'; if (method === 'wallet_switchEthereumChain') throw new Error('no'); if (method === 'eth_sendTransaction') sent.push(1); return null } }
    try { await ch.ensureChain(wrong); ok(false, 'wrong chain must stop') } catch (e) { ok(/Switch your wallet/.test(e.message), 'wrong chain stops with a clear reason'); ok(!sent.length, 'nothing sent on a wrong chain') }
    const liar = { async request({ method }) { if (method === 'eth_chainId') return '0xaa36a7'; return null } } // accepts the switch, stays
    try { await ch.ensureChain(liar); ok(false, 'a wallet that pretends to switch must stop') } catch { pass++ }
  }

  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2) })
