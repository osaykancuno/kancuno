// Read-only check of the mainnet deployment (no transactions)
const { ethers } = require('ethers')
const fs = require('fs')
const abi = n => JSON.parse(fs.readFileSync(`artifacts/src/${n[0]}.sol/${n[1]}.json`)).abi
;(async () => {
  const p = new ethers.JsonRpcProvider('https://ethereum-rpc.publicnode.com')
  const K = process.argv[2]
  const k = new ethers.Contract(K, abi(['KLab', 'KLab']), p)
  const r = new ethers.Contract(await k.renderer(), abi(['KLabRenderer', 'KLabRenderer']), p)
  const out = {
    name: await k.name(), symbol: await k.symbol(), owner: await k.owner(), price: ethers.formatEther(await k.price()),
    max: String(await k.MAX_SUPPLY()), supply: String(await k.totalSupply()), mintOpen: await k.mintOpen(),
    site: await k.site(), renderer: await r.getAddress(), rendererLocked: await k.rendererLocked(),
    royalty: `${await k.royaltyBps()} bps → ${await k.royaltyReceiver()}`, art: await r.art(), viewer: await r.viewer(),
  }
  for (const a of [K, out.renderer, out.art, out.viewer]) out['code ' + a.slice(0, 8)] = ((await p.getCode(a)).length - 2) / 2
  console.log(out)
  const c = JSON.parse(Buffer.from((await k.contractURI()).split(',')[1], 'base64').toString())
  console.log('contractURI:', { ...c, image: c.image.slice(0, 40) + '… (' + c.image.length + ' chars)' })
  // what a token would look like: the deployed renderer, on the original K's design
  const def = await r.defaultDesign()
  const meta = JSON.parse(Buffer.from((await r.tokenURI(1, def, out.site)).split(',')[1], 'base64').toString())
  console.log('token metadata:', { ...meta, image: meta.image.slice(0, 30) + '…', animation_url: meta.animation_url.slice(0, 30) + '…' })
  fs.writeFileSync('out/mainnet-sample-image.svg', Buffer.from(meta.image.split(',')[1], 'base64'))
})()
