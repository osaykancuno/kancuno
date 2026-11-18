// End-to-end check of a deployed K1N0 v2 on Sepolia (KLAB_ADDRESS), with a throwaway test key.
// Real transactions: open the mint, mint, two looks, a transfer, withdraw; the rest are dry runs.
const { ethers } = require('hardhat')
const assert = require('assert')

const C = (...i) => '0x' + i.map(v => v.toString(16).padStart(2, '0')).join('')
const look = (bg, top, centre, front, speed = 1, yaw = 0, pitch = 74, zoom = 100) => C(bg, top, centre, front, speed, (yaw + 256) % 256, pitch, zoom)
const json = uri => JSON.parse(Buffer.from(uri.split(',')[1], 'base64').toString('utf8'))
const settle = () => new Promise(r => setTimeout(r, 6000)) // public RPCs lag a block or two

async function main() {
  const [me] = await ethers.getSigners()
  const klab = await ethers.getContractAt('KLab', process.env.KLAB_ADDRESS)
  const log = (...a) => console.log('  ✔', ...a)
  const reverts = async (p, name) => {
    try { await p; assert.fail(`expected ${name}`) } catch (e) {
      const err = klab.interface.parseError(e.data ?? e.info?.error?.data ?? '0x')
      assert.equal(err?.name, name, `expected ${name}, got ${err?.name ?? e.shortMessage}`)
    }
  }
  assert.equal(await klab.name(), 'THE K.LAB')
  assert.equal(await klab.owner(), me.address)
  assert.equal(await klab.ownerOf(0), me.address)
  assert.equal(await klab.coloursOf(0), '0x00030202')
  const logo = json(await klab.tokenURI(0))
  assert.ok(logo.description.includes('K4NCUN0 logo'))
  log('collection', await klab.name(), '· logo K1N0 #0 owned by the deployer ·', logo.attributes.slice(0, 4).map(a => a.value).join('/'))

  if (!(await klab.mintOpen())) { await (await klab.setMintOpen(true)).wait(2); await settle(); log('mint opened') }
  assert.equal(ethers.formatEther(await klab.price()), '0.0024')
  // a nearly empty test wallet mints at a test price, and the real one is put back at the end
  const low = (await ethers.provider.getBalance(me.address)) < ethers.parseEther('0.003')
  if (low) { await (await klab.setPrice(ethers.parseEther('0.0001'))).wait(2); await settle(); log('test price 0.0001 (wallet low)') }
  const price = await klab.price()

  // four free colours and a free number, at random
  const used = new Set()
  ;(await klab.usedMap()).forEach((w, i) => { for (let b = 0; b < 256; b++) if ((w >> BigInt(b)) & 1n) used.add(i * 256 + b) })
  const free = Array.from({ length: 8362 }, (_, i) => i + 1).filter(n => !used.has(n))
  const id = free[Math.floor(Math.random() * free.length)]
  let colours
  for (;;) {
    const bg = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15][Math.floor(Math.random() * 15)]
    const head = () => { let x; do x = Math.floor(Math.random() * 16); while (x === bg); return x }
    colours = C(bg, head(), head(), head())
    if (!(await klab.coloursTaken(colours))[0]) break
  }
  const rc = await (await klab.mint(colours, 'Sepolia v2', look(1, 1, 2, 4), id, { value: price })).wait(2)
  await settle()
  log(`minted K1N0 #${id} in ${colours} · gas ${rc.gasUsed}`)
  assert.equal(await klab.ownerOf(id), me.address)
  assert.deepEqual([...(await klab.coloursTaken(colours))], [true, BigInt(id)])

  const spare = free.find(n => n !== id)
  await reverts(klab.mint.staticCall(colours, 'Copy', look(8, 8, 8, 8, 3), spare, { value: price }), 'ColoursTaken')
  log('same four colours, other title and look → ColoursTaken')
  await reverts(klab.mint.staticCall(C(1, 0, 2, 3), '', look(0, 0, 0, 0), spare, { value: price }), 'BadColours')
  log('black background → BadColours')
  await reverts(klab.mint.staticCall(C(4, 7, 10, 11), '', look(0, 0, 0, 0), id, { value: price }), 'NumberTaken')
  log(`number #${id} again → NumberTaken`)
  await reverts(klab.mint.staticCall(C(4, 7, 10, 11), '', look(0, 0, 0, 0), 0, { value: price }), 'BadNumber')
  log('#0 (the logo) → BadNumber')

  const r2 = await (await klab.setLook(id, look(6, 6, 5, 7, 2, -30, 50, 120))).wait(2)
  await settle()
  log(`new look · gas ${r2.gasUsed}`)
  const m = json(await klab.tokenURI(id))
  assert.equal(m.attributes.find(a => a.trait_type === 'Looks').value, 2)
  assert.ok(Buffer.from(m.image.split(',')[1], 'base64').toString().startsWith('<svg'))
  assert.ok(Buffer.from(m.animation_url.split(',')[1], 'base64').toString().includes('<canvas'))
  log('tokenURI: 3D image + 3D piece ·', m.attributes.slice(4, 9).map(a => `${a.trait_type}=${a.value}`).join(', '))

  // the K1N0 changes hands: the old holder can no longer set its look
  const next = ethers.Wallet.createRandom().address
  await (await klab.transferFrom(me.address, next, id)).wait(2)
  for (let i = 0; i < 20 && (await klab.ownerOf(id)) !== next; i++) await settle() // until the node sees it
  await reverts(klab.setLook.staticCall(id, look(0, 0, 0, 0)), 'NotAuthorized')
  const [, by2] = await klab.lookAt(id, 2)
  assert.equal(by2, me.address)
  log(`transferred to ${next.slice(0, 10)}… · the old holder cannot change the look · history keeps look 2 by the old holder`)

  if (low) { await (await klab.setPrice(ethers.parseEther('0.0024'))).wait(2); await settle(); assert.equal(ethers.formatEther(await klab.price()), '0.0024'); log('price back to 0.0024') }
  const bal = await ethers.provider.getBalance(await klab.getAddress())
  await (await klab.withdraw()).wait(2)
  log('withdraw', ethers.formatEther(bal), 'ETH back to the owner')
  console.log('\nALL CHECKS PASSED on Sepolia ·', process.env.KLAB_ADDRESS)
}
main().catch(e => { console.error('CHECK FAILED:', e.message || e); process.exit(1) })
