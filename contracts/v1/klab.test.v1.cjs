// THE K.LAB · K1N1: contract tests (Hardhat in-process network).
// The design bytes come from the site's own codec (src/lib/lab/onchain.ts), so site and chain agree.
const { expect } = require('chai')
const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

const PRICE = ethers.parseEther('0.0042')
const OUT = path.join(__dirname, '..', 'out', 'samples')

// A K design as the Lab makes it (the parts the codec reads)
const base = () => ({
  v: 1, name: 'Original K', form: 'vector', view: '3d',
  bg: { visible: true, line: false, fill: { kind: 'solid', a: '#fbc500' } },
  body: { visible: true, line: false, fill: { kind: 'solid', a: '#0f0d0a' } },
  head: { visible: true, line: false, useFill: false, fill: { kind: 'solid', a: '#0f0d0a' },
    cubes: ['#0f0d0a', '#0f0d0a', '#0f0d0a', '#9559bb', '#0f0d0a', '#fc98ca', '#fc98ca'] },
  fx: { glow: 0, glitch: 0, pixel: 0, grain: 0, scan: 0, depth: 0, seed: 8362 },
  grid: { size: 32, gap: 0, cells: [] },
  anim: { loops: [], period: 2.4 },
  cam: { yaw: 0, pitch: 74, zoom: 1 },
  img: null,
})

describe('THE K.LAB · K1N1', function () {
  this.timeout(120000)
  let codec, klab, renderer, owner, alice, bob

  const enc = d => {
    const e = codec.encodeDesign(d)
    if (!e.bytes) throw new Error(e.problems.join(' '))
    return codec.toHex(e.bytes)
  }
  const decodeURI = uri => JSON.parse(Buffer.from(uri.split(',')[1], 'base64').toString('utf8'))
  const svgOf = meta => Buffer.from(meta.image.split(',')[1], 'base64').toString('utf8')

  before(async () => {
    codec = await import('../../src/lib/lab/onchain.ts')
    ;[owner, alice, bob] = await ethers.getSigners()
    const dep = n => ethers.getContractFactory(n).then(f => f.deploy())
    const [fill, fx, motion] = await Promise.all([dep('KLabArtFill'), dep('KLabArtFx'), dep('KLabArtMotion')])
    const art = await (await ethers.getContractFactory('KLabArt')).deploy(await fill.getAddress(), await fx.getAddress(), await motion.getAddress())
    const viewer = await (await ethers.getContractFactory('KLabViewer')).deploy()
    renderer = await (await ethers.getContractFactory('KLabRenderer')).deploy(await art.getAddress(), await viewer.getAddress())
    klab = await (await ethers.getContractFactory('KLab')).deploy(await renderer.getAddress(), owner.address)
    fs.mkdirSync(OUT, { recursive: true })
  })

  it('has the name, the symbol, the cap and the price', async () => {
    expect(await klab.name()).to.equal('THE K.LAB')
    expect(await klab.symbol()).to.equal('K1N1')
    expect(await klab.MAX_SUPPLY()).to.equal(8362n)
    expect(await klab.price()).to.equal(PRICE)
  })

  it('keeps one palette on-chain, in the codec and in the Lab swatches', async () => {
    const onchain = (await klab.PALETTE()).slice(2).match(/.{6}/g).map(h => '#' + h)
    expect(onchain).to.deep.equal(codec.K1N1)
    const baseTs = fs.readFileSync(path.join(__dirname, '../../src/lib/lab/base.ts'), 'utf8')
    const brand = Object.fromEntries([...baseTs.matchAll(/(\w+): '(#[0-9a-f]{6})'/g)].map(m => [m[1], m[2]]))
    const start = baseTs.indexOf('K1N1_PALETTE = [')
    const block = baseTs.slice(start, baseTs.indexOf('] as const', start))
    const swatches = [...block.matchAll(/BRAND\.(\w+)|'(#[0-9a-f]{6})'/g)].map(m => (m[1] ? brand[m[1]] : m[2]))
    expect(swatches).to.deep.equal(codec.K1N1)
  })

  it('mints the original K, stores the design and draws it on-chain', async () => {
    const data = enc(base())
    expect(await klab.mintedAs(data)).to.equal(0n)
    const tx = await klab.connect(alice).mint(data, 1, { value: PRICE })
    const rc = await tx.wait()
    console.log('      gas, vector mint:', rc.gasUsed.toString())
    expect(await klab.ownerOf(1)).to.equal(alice.address)
    expect(await klab.totalSupply()).to.equal(1n)
    expect(await klab.designOf(1)).to.equal(data)
    expect(await klab.mintedAs(data)).to.equal(1n)
    const meta = decodeURI(await klab.tokenURI(1))
    expect(meta.name).to.equal('K1N1 #1')
    expect(meta.external_url).to.equal('https://www.kancuno.com/lab/token?id=1')
    expect(meta.description).to.match(/^“Original K” · K1N1 #1 of 8,362 from THE K.LAB by K4NCUN0\./)
    const trait = n => meta.attributes.find(a => a.trait_type === n)?.value
    expect([trait('Background'), trait('Background style'), trait('X'), trait('Head top'), trait('Head sides'), trait('Head centre'), trait('Head front')])
      .to.deep.equal(['Yellow', 'Solid', 'Ink', 'Ink', 'Ink', 'Purple', 'Pink'])
    expect(trait('Colours')).to.equal(4)
    expect([trait('Finish'), trait('Effect'), trait('Animated')]).to.deep.equal(['Clay', 'None', 'No'])
    const svg = svgOf(meta)
    expect(svg).to.match(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/)
    // the interactive 3D page, on-chain: the viewer with this token's design
    const page = Buffer.from(meta.animation_url.split(',')[1], 'base64').toString('utf8')
    expect(page).to.include('<canvas id="c"')
    expect(page).to.include('const D="' + data.slice(2) + '"')
    fs.writeFileSync(path.join(OUT, '1-original-3d.html'), page)
    expect(svg).to.include('fill="#9559bb"')
    fs.writeFileSync(path.join(OUT, '1-original.svg'), svg)
    // the codec reads back what the chain stored
    const back = codec.decodeDesign(codec.fromHex(await klab.designOf(1)), base())
    expect(back.head.cubes).to.deep.equal(base().head.cubes)
    expect(back.name).to.equal('Original K')
  })

  it('refuses the same colours again, whatever the effects, loops, title or 3D view', async () => {
    const d = base()
    d.name = 'Same colours'
    d.fx = { ...d.fx, glow: 0.8, glitch: 0.5, grain: 0.4, seed: 7 }
    d.anim = { loops: ['pulse', 'wave'], period: 3 }
    d.cam = { yaw: 90, pitch: 30, zoom: 1.5 }
    d.body.line = true
    await expect(klab.connect(bob).mint(enc(d), 2, { value: PRICE })).to.be.revertedWithCustomError(klab, 'AlreadyMinted').withArgs(1n)
  })

  it('treats a gradient as its two colours in either order', async () => {
    const d = base()
    d.bg.fill = { kind: 'gradient', a: '#ff4fd8', b: '#1d2a6b', angle: 90 }
    await (await klab.connect(bob).mint(enc(d), 2, { value: PRICE })).wait()
    d.bg.fill = { kind: 'pattern', pattern: 'dots', a: '#1d2a6b', b: '#ff4fd8', scale: 4 }
    await expect(klab.connect(bob).mint(enc(d), 3, { value: PRICE })).to.be.revertedWithCustomError(klab, 'AlreadyMinted')
  })

  it('accepts a K that differs by one clearly different colour', async () => {
    const d = base()
    d.head.cubes = [...d.head.cubes]
    d.head.cubes[3] = '#27e07a'
    await (await klab.connect(bob).mint(enc(d), 3, { value: PRICE })).wait()
    expect(await klab.balanceOf(bob.address)).to.equal(2n)
  })

  it('refuses colours outside the K1N1 palette (no near-copies)', async () => {
    const d = base()
    d.head.cubes = [...d.head.cubes]
    d.head.cubes[0] = '#100d0a' // one step from the ink
    expect(codec.encodeDesign(d).bytes).to.equal(null) // the site blocks it…
    const raw = codec.fromHex(enc(base()))
    raw[27] = 0x10 // …and so does the contract
    await expect(klab.connect(bob).mint(codec.toHex(raw), 9, { value: PRICE })).to.be.revertedWithCustomError(klab, 'OffPalette')
    // matching to the palette brings it back to the ink, which is taken
    const snapped = codec.snapToK1N1(d)
    expect(snapped.head.cubes[0]).to.equal('#0f0d0a')
  })

  it('refuses a wrong price, malformed designs and a closed mint', async () => {
    const d = base()
    d.head.cubes = ['#ff3b30', '#ff3b30', '#ff3b30', '#fbc500', '#ff3b30', '#fff6dc', '#fff6dc']
    const data = enc(d)
    await expect(klab.connect(bob).mint(data, 10)).to.be.revertedWithCustomError(klab, 'WrongPrice')
    await expect(klab.connect(bob).mint(data, 10, { value: PRICE * 2n })).to.be.revertedWithCustomError(klab, 'WrongPrice')
    const bad = codec.fromHex(data)
    bad[0] = 2
    await expect(klab.connect(bob).mint(codec.toHex(bad), 10, { value: PRICE })).to.be.revertedWithCustomError(klab, 'BadDesign')
    const solidWithB = codec.fromHex(data)
    solidWithB[7] = 1 // a solid with a second colour: not canonical
    await expect(klab.connect(bob).mint(codec.toHex(solidWithB), 10, { value: PRICE })).to.be.revertedWithCustomError(klab, 'BadDesign')
    await expect(klab.connect(bob).setMintOpen(false)).to.be.revertedWithCustomError(klab, 'NotOwner')
    await (await klab.setMintOpen(false)).wait()
    await expect(klab.connect(bob).mint(data, 10, { value: PRICE })).to.be.revertedWithCustomError(klab, 'MintClosed')
    await (await klab.setMintOpen(true)).wait()
  })

  it('draws every style, effect and loop', async () => {
    const d = base()
    d.name = "Neon #9 it's on!"
    d.bg.fill = { kind: 'pattern', pattern: 'grid', a: '#1d2a6b', b: '#2f6bff', scale: 5 }
    d.body = { visible: true, line: true, fill: { kind: 'gradient', a: '#ff4fd8', b: '#3ff2ff', angle: 135 } }
    d.head = { ...d.head, line: true, cubes: ['#3ff2ff', '#3ff2ff', '#3ff2ff', '#ff4fd8', '#3ff2ff', '#fbc500', '#fbc500'] }
    d.fx = { glow: 0.75, glitch: 0.45, pixel: 0.3, grain: 0.4, scan: 0.5, depth: 0.6, seed: 4242 }
    d.anim = { loops: ['pulse', 'bounce', 'float', 'wave', 'blink', 'spin', 'rain', 'glitch', 'scan'], period: 2.4 }
    const data = enc(d)
    const rc = await (await klab.connect(alice).mint(data, 4200, { value: PRICE })).wait()
    const id = 4200n
    console.log('      gas, all-effects mint:', rc.gasUsed.toString())
    const gas = await ethers.provider.estimateGas({ to: await klab.getAddress(), data: klab.interface.encodeFunctionData('tokenURI', [id]) })
    console.log('      gas, tokenURI (read):', gas.toString())
    const meta = decodeURI(await klab.tokenURI(id))
    const svg = svgOf(meta)
    for (const s of ['<linearGradient', '<pattern', 'k-fx', 'k-sp', 'k-sh', 'k-gr', 'k-sl', '<animateTransform', 'attributeName="stdDeviation"', 'attributeName="height"']) expect(svg).to.include(s)
    expect(meta.attributes.filter(a => a.trait_type === 'Loop')).to.have.length(8) // the glitch loop is Lab-only
    expect(meta.description).to.include("Neon #9 it's on!")
    const trait = n => meta.attributes.find(a => a.trait_type === n)?.value
    expect([trait('Background'), trait('Background style'), trait('X'), trait('X style'), trait('Finish'), trait('Colours')])
      .to.deep.equal(['Navy & Blue', 'Grid', 'Magenta & Cyan', 'Gradient', 'Neon', 5])
    expect(meta.attributes.filter(a => a.trait_type === 'Effect')).to.have.length(6)
    fs.writeFileSync(path.join(OUT, '2-everything.svg'), svg)
  })

  it('keeps a one-fill head honest: its squares carry the fill colour', async () => {
    const d = base()
    d.head = { ...d.head, useFill: true, fill: { kind: 'gradient', a: '#3ff2ff', b: '#ff4fd8', angle: 90 } }
    d.anim = { loops: ['rain'], period: 2.4 }
    const data = codec.fromHex(enc(d))
    expect(data[27]).to.equal(0x3f) // the codec writes the fill colour into the squares
    expect(await renderer.validate(codec.toHex(data))).to.equal(true)
    data[27] = 0x12; data[28] = 0x34; data[29] = 0x56 // an off-palette square under a one-fill head
    expect(await renderer.validate(codec.toHex(data))).to.equal(false)
  })

  it('mints only the clay K: no pixel form, no hidden head or X', async () => {
    const d = base()
    d.form = 'pixel'
    d.grid = { size: 24, gap: 0, cells: Array(576).fill('#fbc500') }
    expect(codec.encodeDesign(d).bytes).to.equal(null) // the site says so…
    const raw = codec.fromHex(enc(base()))
    raw[1] = 1 // …and the contract refuses it
    await expect(klab.connect(bob).mint(codec.toHex(raw), 11, { value: PRICE })).to.be.revertedWithCustomError(klab, 'BadDesign')
    const v = base()
    v.bg.fill = { kind: 'solid', a: '#c8f04a' }
    v.head.visible = false
    expect(codec.encodeDesign(v).bytes).to.equal(null)
    const flags = codec.fromHex(enc(base()))
    flags[2] = 1 | 2 // background and X only
    flags[4] = 0xc8; flags[5] = 0xf0; flags[6] = 0x4a
    await expect(klab.connect(bob).mint(codec.toHex(flags), 11, { value: PRICE })).to.be.revertedWithCustomError(klab, 'NotAK')
  })

  it('lets the minter pick the number, or a free one at random', async () => {
    const d = base()
    d.head.cubes = ['#ff7a1a', '#ff7a1a', '#ff7a1a', '#3ff2ff', '#ff7a1a', '#fff6dc', '#fff6dc']
    const data = enc(d)
    await expect(klab.connect(bob).mint(data, 0, { value: PRICE })).to.be.revertedWithCustomError(klab, 'BadNumber')
    await expect(klab.connect(bob).mint(data, 8363, { value: PRICE })).to.be.revertedWithCustomError(klab, 'BadNumber')
    await expect(klab.connect(bob).mint(data, 4200, { value: PRICE })).to.be.revertedWithCustomError(klab, 'NumberTaken').withArgs(4200n)
    expect(await klab.isAvailable(4200)).to.equal(false)
    expect(await klab.isAvailable(8362)).to.equal(true)
    await (await klab.connect(bob).mint(data, 8362, { value: PRICE })).wait()
    expect(await klab.ownerOf(8362)).to.equal(bob.address)
    // the map of used numbers, read in one call, is what the Random button picks from
    const words = await klab.usedMap()
    expect(words.length).to.equal(33)
    const used = []
    words.forEach((w, i) => { for (let b = 0; b < 256; b++) if ((w >> BigInt(b)) & 1n) used.push(i * 256 + b) })
    expect(used).to.deep.equal([1, 2, 3, 4200, 8362])
    const free = Array.from({ length: 8362 }, (_, i) => i + 1).filter(n => !used.includes(n))
    const pick = free[Math.floor(Math.random() * free.length)]
    expect(await klab.isAvailable(pick)).to.equal(true)
  })

  it('pays the owner and nobody else', async () => {
    const bal = await ethers.provider.getBalance(await klab.getAddress())
    expect(bal).to.equal(PRICE * (await klab.totalSupply()))
    await expect(klab.connect(bob).withdraw()).to.be.revertedWithCustomError(klab, 'NotOwner')
    await expect(klab.withdraw()).to.changeEtherBalance(owner, bal)
  })

  it('transfers like any ERC-721 and reports royalties and interfaces', async () => {
    await (await klab.connect(alice).transferFrom(alice.address, bob.address, 1)).wait()
    expect(await klab.ownerOf(1)).to.equal(bob.address)
    await expect(klab.connect(alice).transferFrom(bob.address, alice.address, 1)).to.be.revertedWithCustomError(klab, 'NotAuthorized')
    expect(await klab.supportsInterface('0x80ac58cd')).to.equal(true)
    expect(await klab.supportsInterface('0x2a55205a')).to.equal(true)
    const [, fee] = await klab.royaltyInfo(1, ethers.parseEther('1'))
    expect(fee).to.equal(0n)
    const c = JSON.parse(Buffer.from((await klab.contractURI()).split(',')[1], 'base64').toString())
    expect(c.name).to.equal('THE K.LAB')
  })

  it('switches to a new renderer and tells marketplaces to refresh', async () => {
    const art = await renderer.art(), viewer = await renderer.viewer()
    const next = await (await ethers.getContractFactory('KLabRenderer')).deploy(art, viewer)
    await expect(klab.connect(bob).setRenderer(await next.getAddress())).to.be.revertedWithCustomError(klab, 'NotOwner')
    await expect(klab.setRenderer(await next.getAddress())).to.emit(klab, 'BatchMetadataUpdate')
    const c = JSON.parse(Buffer.from((await klab.contractURI()).split(',')[1], 'base64').toString())
    expect(c.description).to.include('8,362')
    expect(c.description).to.not.include('Free')
    renderer = next
  })

  it('can lock the renderer forever', async () => {
    await (await klab.lockRenderer()).wait()
    await expect(klab.setRenderer(await renderer.getAddress())).to.be.revertedWithCustomError(klab, 'Locked')
  })
})

describe('KLab deployers', function () {
  this.timeout(120000)
  it('deploys the collection in two transactions, owned by the sender', async () => {
    const [, , , carol] = await ethers.getSigners()
    const A = await ethers.getContractFactory('KLabDeployArt')
    const B = await ethers.getContractFactory('KLabDeployCollection')
    console.log('      initcode:', (A.bytecode.length - 2) / 2, '+', (B.bytecode.length - 2) / 2, 'bytes (limit 49152 each)')
    const a = await A.connect(carol).deploy()
    const ra = await a.deploymentTransaction().wait()
    const ea = ra.logs.map(l => { try { return a.interface.parseLog(l) } catch { return null } }).find(e => e?.name === 'ArtDeployed')
    const b = await B.connect(carol).deploy(ea.args.art, ea.args.viewer)
    const rb = await b.deploymentTransaction().wait()
    console.log('      gas:', ra.gasUsed.toString(), '+', rb.gasUsed.toString())
    const eb = rb.logs.map(l => { try { return b.interface.parseLog(l) } catch { return null } }).find(e => e?.name === 'Deployed')
    const klab = await ethers.getContractAt('KLab', eb.args.klab)
    expect(await klab.owner()).to.equal(carol.address)
    const meta = JSON.parse(Buffer.from((await klab.contractURI()).split(',')[1], 'base64').toString())
    expect(meta.name).to.equal('THE K.LAB')
  })
})
