// Read-only check of a deployed KLabRenderer2 before (or after) the switch: same art and viewer as
// the first renderer, the exact compiled code, and the metadata it would write for real tokens.
//   node scripts/renderer2-live-check.cjs <renderer2 address>
const { ethers } = require('ethers')
const fs = require('fs')
const KLAB = '0x25c8518e54b7cbb6cfe16d11bda5d543fb9e397f'
const abi = n => JSON.parse(fs.readFileSync(`artifacts/src/${n}.sol/${n}.json`)).abi
const json = uri => JSON.parse(Buffer.from(uri.split(',')[1], 'base64').toString('utf8'))
;(async () => {
  const p = new ethers.JsonRpcProvider('https://ethereum-rpc.publicnode.com')
  const R2 = process.argv[2]
  const k = new ethers.Contract(KLAB, abi('KLab'), p)
  const r1 = new ethers.Contract(await k.renderer(), abi('KLabRenderer'), p)
  const r2 = new ethers.Contract(R2, abi('KLabRenderer2'), p)
  const art = JSON.parse(fs.readFileSync('artifacts/src/KLabRenderer2.sol/KLabRenderer2.json'))
  const code = await p.getCode(R2)
  // the deployed runtime code = the compiled one, except the immutables (art, viewer) filled in
  const imm = art.deployedLinkReferences && Object.keys(art.deployedLinkReferences).length
  const expected = art.deployedBytecode.toLowerCase()
  let same = code.length === expected.length
  if (same) {
    const a1 = (await r2.art()).slice(2).toLowerCase(), v1 = (await r2.viewer()).slice(2).toLowerCase()
    const norm = s => s.toLowerCase().split(a1.padStart(64, '0')).join('0'.repeat(64)).split(v1.padStart(64, '0')).join('0'.repeat(64))
    same = norm(code) === norm(expected)
  }
  const site = await k.site()
  const out = { renderer2: R2, inUse: (await k.renderer()).toLowerCase() === R2.toLowerCase(), sameCode: same, linkRefs: imm || 0,
    sameArt: (await r2.art()) === (await r1.art()), sameViewer: (await r2.viewer()) === (await r1.viewer()), acceptsDefaultLook: await r2.validLook('0x0000000001004a64') }
  const data = await k.dataOf(0)
  const a = json(await r1.tokenURI(0, data, site)), b = json(await r2.tokenURI(0, data, site))
  out.token0 = { sameImage: a.image === b.image, sameAnimation: a.animation_url === b.animation_url, sameTraits: JSON.stringify(a.attributes) === JSON.stringify(b.attributes), external_url: b.external_url, description: b.description }
  const c = json(await r2.contractURI(site))
  out.collection = { external_link: c.external_link, description: c.description.slice(0, 160) + '…' }
  if (out.inUse) out.liveTokenURI0 = json(await k.tokenURI(0)).description.slice(0, 120) + '…'
  console.log(JSON.stringify(out, null, 2))
  const ok = out.sameCode && out.sameArt && out.sameViewer && out.acceptsDefaultLook && out.token0.sameImage && out.token0.sameAnimation && out.token0.sameTraits
  process.exit(ok ? 0 : 1)
})().catch(e => { console.error(e); process.exit(2) })
