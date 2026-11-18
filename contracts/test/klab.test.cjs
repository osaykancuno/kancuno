// THE K.LAB · K1N0 (v2: four colours on a black K, living looks with on-chain history).
const { expect } = require('chai')
const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

const PRICE = ethers.parseEther('0.0024')
const OUT = path.join(__dirname, '..', 'out', 'samples')
const LOGO = '0x00030202' // yellow background, purple centre, pink front blocks
const LOOK0 = '0x0000000001004a64' // no effects, speed 1, front view
// palette: 0 yellow, 1 ink, 2 pink, 3 purple, 4 cream, 5 grey, 6 cyan, 7 blue, 8 green, 9 red, 10 orange, 11 brown, 12 tan, 13 magenta, 14 navy, 15 lime
const C = (...i) => '0x' + i.map(v => v.toString(16).padStart(2, '0')).join('')
const look = (bg, top, centre, front, speed = 1, yaw = 0, pitch = 74, zoom = 100) => C(bg, top, centre, front, speed, (yaw + 256) % 256, pitch, zoom)
const json = uri => JSON.parse(Buffer.from(uri.split(',')[1], 'base64').toString('utf8'))
const media = s => Buffer.from(s.split(',')[1], 'base64').toString('utf8')
const trait = (m, n) => m.attributes.find(a => a.trait_type === n)?.value

describe('THE K.LAB · K1N0', function () {
  this.timeout(180000)
  let klab, renderer, owner, alice, bob, carol

  before(async () => {
    ;[owner, alice, bob, carol] = await ethers.getSigners()
    const f = n => ethers.getContractFactory(n)
    const bg = await (await f('KLabArtBg')).deploy()
    const art = await (await f('KLabArt3D')).deploy(await bg.getAddress())
    const viewer = await (await f('KLabViewer')).deploy()
    renderer = await (await f('KLabRenderer')).deploy(await art.getAddress(), await viewer.getAddress())
    klab = await (await f('KLab')).deploy(await renderer.getAddress(), owner.address, LOGO, 'K4NCUN0')
    expect(await klab.mintOpen()).to.equal(false) // closed until the launch
    await (await klab.setMintOpen(true)).wait()
    fs.mkdirSync(OUT, { recursive: true })
  })

  it('is born with the K4NCUN0 logo as K1N0 #0, owned by the artist', async () => {
    expect(await klab.name()).to.equal('THE K.LAB')
    expect(await klab.symbol()).to.equal('K1N0')
    expect(await klab.price()).to.equal(PRICE)
    expect(await klab.ownerOf(0)).to.equal(owner.address)
    expect(await klab.totalSupply()).to.equal(1n)
    expect(await klab.coloursOf(0)).to.equal(LOGO)
    expect(await klab.titleOf(0)).to.equal('K4NCUN0')
    expect(await klab.coloursTaken(LOGO)).to.deep.equal([true, 0n])
    expect(await klab.isAvailable(0)).to.equal(false)
    expect(await klab.isAvailable(1)).to.equal(true)
    const m = json(await klab.tokenURI(0))
    expect(m.name).to.equal('K1N0 #0')
    expect(m.description).to.include('the K4NCUN0 logo')
    expect([trait(m, 'Background'), trait(m, 'Centre'), trait(m, 'Front left'), trait(m, 'Front right')]).to.deep.equal(['Yellow', 'Purple', 'Pink', 'Pink'])
    expect([trait(m, 'Background effect'), trait(m, 'Centre effect'), trait(m, 'Colours'), trait(m, 'Looks')]).to.deep.equal(['Plain', 'None', 3, 1])
    const svg = media(m.image)
    expect(svg).to.match(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/)
    expect(svg).to.include('fill="#fbc500"')
    const html = media(m.animation_url)
    expect(html).to.include('const D="00030202' + LOOK0.slice(2) + '0001074b344e43554e30"')
    fs.writeFileSync(path.join(OUT, 'v2-logo.svg'), svg)
    fs.writeFileSync(path.join(OUT, 'v2-logo.html'), html)
    const c = json(await klab.contractURI())
    expect(c.name).to.equal('THE K.LAB')
    expect(c.description).to.include('8,362')
  })

  it('mints a K1N0 in four colours, with the number the minter picks', async () => {
    const colours = C(14, 6, 13, 0) // navy, cyan, magenta, yellow
    await expect(klab.connect(alice).mint(colours, 'Night signal', look(1, 1, 2, 0), 4671, { value: PRICE }))
      .to.emit(klab, 'Transfer').withArgs(ethers.ZeroAddress, alice.address, 4671n)
      .and.to.emit(klab, 'LookSet').withArgs(4671n, 1n, alice.address, look(1, 1, 2, 0))
    expect(await klab.ownerOf(4671)).to.equal(alice.address)
    expect(await klab.titleOf(4671)).to.equal('Night signal')
    expect(await klab.lookOf(4671)).to.equal(look(1, 1, 2, 0))
    const m = json(await klab.tokenURI(4671))
    expect(m.description).to.match(/^“Night signal” · K1N0 #4671 of 8,362/)
    expect([trait(m, 'Background'), trait(m, 'Centre effect'), trait(m, 'Front left effect')]).to.deep.equal(['Navy', 'Glow', 'Pulse'])
  })

  it('never mints the same four colours twice, whatever the title, look or number', async () => {
    await expect(klab.connect(bob).mint(C(14, 6, 13, 0), 'Copy', look(8, 8, 8, 8, 3, 30, 40, 150), 77, { value: PRICE }))
      .to.be.revertedWithCustomError(klab, 'ColoursTaken').withArgs(4671n)
    await expect(klab.connect(bob).mint(LOGO, '', LOOK0, 78, { value: PRICE }))
      .to.be.revertedWithCustomError(klab, 'ColoursTaken').withArgs(0n)
    // one colour apart is another K1N0
    await (await klab.connect(bob).mint(C(14, 6, 13, 2), '', LOOK0, 77, { value: PRICE })).wait()
  })

  it('keeps the K readable: no black background, head colours apart from it', async () => {
    const m = (c, id) => klab.connect(bob).mint(c, '', LOOK0, id, { value: PRICE })
    await expect(m(C(1, 0, 2, 3), 90)).to.be.revertedWithCustomError(klab, 'BadColours') // black background
    await expect(m(C(0, 0, 2, 3), 90)).to.be.revertedWithCustomError(klab, 'BadColours') // centre = background
    await expect(m(C(0, 1, 2, 16), 90)).to.be.revertedWithCustomError(klab, 'BadColours') // not in the palette
    await (await m(C(0, 1, 1, 1), 90)).wait() // an all-black head on yellow is fine
  })

  it('checks numbers, price, titles and looks', async () => {
    const c = C(4, 7, 10, 11)
    await expect(klab.connect(bob).mint(c, '', LOOK0, 0, { value: PRICE })).to.be.revertedWithCustomError(klab, 'BadNumber')
    await expect(klab.connect(bob).mint(c, '', LOOK0, 8363, { value: PRICE })).to.be.revertedWithCustomError(klab, 'BadNumber')
    await expect(klab.connect(bob).mint(c, '', LOOK0, 4671, { value: PRICE })).to.be.revertedWithCustomError(klab, 'NumberTaken')
    await expect(klab.connect(bob).mint(c, '', LOOK0, 100)).to.be.revertedWithCustomError(klab, 'WrongPrice')
    await expect(klab.connect(bob).mint(c, 'Bad "title"', LOOK0, 100, { value: PRICE })).to.be.revertedWithCustomError(klab, 'BadTitle')
    await expect(klab.connect(bob).mint(c, 'x'.repeat(33), LOOK0, 100, { value: PRICE })).to.be.revertedWithCustomError(klab, 'BadTitle')
    for (const t of ['my k4NcUn0 copy', 'KANCUNO', 'k4ncuno', 'Kancun0!']) {
      await expect(klab.connect(bob).mint(c, t, LOOK0, 100, { value: PRICE })).to.be.revertedWithCustomError(klab, 'BadTitle')
    }
    await expect(klab.getApproved(101)).to.be.revertedWithCustomError(klab, 'NoToken')
    await expect(klab.lookAt(0, 0)).to.be.revertedWithCustomError(klab, 'NoToken')
    await expect(klab.lookAt(0, 2)).to.be.revertedWithCustomError(klab, 'NoToken')
    for (const bad of [look(9, 0, 0, 0), look(0, 0, 0, 9), look(0, 0, 0, 0, 4), look(0, 0, 0, 0, 1, 0, 19), look(0, 0, 0, 0, 1, 0, 74, 191)]) {
      await expect(klab.connect(bob).mint(c, '', bad, 100, { value: PRICE })).to.be.revertedWithCustomError(klab, 'BadLook')
    }
    await (await klab.connect(bob).mint(c, "it's #8362!", LOOK0, 8362, { value: PRICE })).wait()
    const used = []
    ;(await klab.usedMap()).forEach((w, i) => { for (let b = 0; b < 256; b++) if ((w >> BigInt(b)) & 1n) used.push(i * 256 + b) })
    expect(used).to.deep.equal([0, 77, 90, 4671, 8362])
  })

  it('lets the holder change the look for the gas only, and keeps every look with who set it', async () => {
    await expect(klab.connect(bob).setLook(4671, look(2, 0, 0, 0))).to.be.revertedWithCustomError(klab, 'NotAuthorized')
    const tx = await klab.connect(alice).setLook(4671, look(5, 4, 6, 7, 2, -20, 50, 120))
    const rc = await tx.wait()
    console.log('      gas, set a look:', rc.gasUsed.toString())
    await expect(tx).to.emit(klab, 'MetadataUpdate').withArgs(4671n)
    expect(await klab.looksCount(4671)).to.equal(2n)
    // the K1N0 changes hands: the story goes on with the new holder
    await (await klab.connect(alice).transferFrom(alice.address, carol.address, 4671)).wait()
    await expect(klab.connect(alice).setLook(4671, LOOK0)).to.be.revertedWithCustomError(klab, 'NotAuthorized')
    await (await klab.connect(carol).setLook(4671, look(8, 3, 1, 5, 3))).wait()
    expect(await klab.looksCount(4671)).to.equal(3n)
    const [l1, by1] = await klab.lookAt(4671, 1)
    const [, by2, t2] = await klab.lookAt(4671, 2)
    const [l3, by3] = await klab.lookAt(4671, 3)
    expect([l1, by1, by2, by3]).to.deep.equal([look(1, 1, 2, 0), alice.address, alice.address, carol.address])
    expect(l3).to.equal(look(8, 3, 1, 5, 3))
    expect(t2).to.be.greaterThan(0n)
    const m = json(await klab.tokenURI(4671))
    expect(trait(m, 'Looks')).to.equal(3)
    expect(m.description).to.include('this K1N0 has had 3 looks')
    // a marketplace approved to move it cannot change its look; an app the holder chose can
    await (await klab.connect(carol).approve(bob.address, 4671)).wait()
    await (await klab.connect(carol).setApprovalForAll(bob.address, true)).wait()
    await expect(klab.connect(bob).setLook(4671, LOOK0)).to.be.revertedWithCustomError(klab, 'NotAuthorized')
    await (await klab.connect(carol).setApprovalForAll(bob.address, false)).wait()
    await (await klab.connect(carol).approve(ethers.ZeroAddress, 4671)).wait()
    await (await klab.connect(carol).setLookOperator(bob.address, true)).wait()
    await (await klab.connect(bob).setLook(4671, LOOK0)).wait()
    await expect(klab.connect(bob).setLook(4671, look(9, 0, 0, 0))).to.be.revertedWithCustomError(klab, 'BadLook')
    await (await klab.connect(carol).setLookOperator(bob.address, false)).wait()
  })

  it('draws every effect of every colour, in the image and in the 3D piece', async () => {
    let worst = 0n
    const page = []
    for (let fx = 0; fx <= 8; fx++) {
      await (await klab.connect(carol).setLook(4671, look(fx, fx, (fx + 3) % 9, (fx + 6) % 9, fx % 4, fx * 5 - 20, 30 + fx * 6, 70 + fx * 12))).wait()
      const uri = await klab.tokenURI(4671)
      const gas = await ethers.provider.estimateGas({ to: await klab.getAddress(), data: klab.interface.encodeFunctionData('tokenURI', [4671]) })
      if (gas > worst) worst = gas
      const m = json(uri)
      const svg = media(m.image)
      expect(svg.endsWith('</svg>')).to.equal(true)
      expect(media(m.animation_url)).to.include('<canvas id="c"')
      page.push(`<figure style="margin:0;color:#ccc;font:12px sans-serif">${svg.replace('width="1024" height="1024"', 'width="220" height="220"').replace(/id="k/g, `id="k${fx}`).replace(/url\(#k/g, `url(#k${fx}`)}<figcaption>bg ${trait(m, 'Background effect')} · centre ${trait(m, 'Centre effect')} · front ${trait(m, 'Front left effect')} / ${trait(m, 'Front right effect')}</figcaption></figure>`)
    }
    console.log('      gas, heaviest tokenURI (read):', worst.toString())
    expect(worst).to.be.lessThan(15_000_000n)
    fs.writeFileSync(path.join(OUT, 'v2-effects.html'), `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(3,220px);gap:12px;padding:12px">${page.join('')}`)
  })

  it('gives the owner the usual controls, safely', async () => {
    await expect(klab.connect(bob).setPrice(0)).to.be.revertedWithCustomError(klab, 'NotOwner')
    await expect(klab.setSite('https://x"y')).to.be.revertedWithCustomError(klab, 'BadSite')
    await expect(klab.transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(klab, 'ZeroAddress')
    await (await klab.setMintOpen(false)).wait()
    await expect(klab.connect(bob).mint(C(5, 6, 7, 8), '', LOOK0, 300, { value: PRICE })).to.be.revertedWithCustomError(klab, 'MintClosed')
    await (await klab.setMintOpen(true)).wait()
    const bal = await ethers.provider.getBalance(await klab.getAddress())
    expect(bal).to.equal(PRICE * 4n)
    await expect(klab.withdraw()).to.changeEtherBalance(owner, bal)
    await (await klab.setRoyalty(owner.address, 500)).wait()
    await (await klab.transferOwnership(alice.address)).wait()
    expect(await klab.owner()).to.equal(owner.address) // not until alice accepts
    await expect(klab.connect(bob).acceptOwnership()).to.be.revertedWithCustomError(klab, 'NotAuthorized')
    await (await klab.connect(alice).acceptOwnership()).wait()
    expect(await klab.owner()).to.equal(alice.address)
    const [rcv] = await klab.royaltyInfo(0, 100)
    expect(rcv).to.equal(alice.address) // royalties followed the owner
    await (await klab.connect(alice).transferOwnership(owner.address)).wait()
    await (await klab.acceptOwnership()).wait()
    expect(await klab.supportsInterface('0x49064906')).to.equal(true)
  })

  it('can grow: extensions mint under their own rules, apps set looks for holders, the renderer decides the effects', async () => {
    // extensions: only the owner adds them, they mint free numbers with the same K1N0 rules, then can be locked out
    await expect(klab.connect(bob).extensionMint(bob.address, C(9, 4, 6, 7), '', LOOK0, 500)).to.be.revertedWithCustomError(klab, 'NotAuthorized')
    await expect(klab.connect(bob).setExtension(bob.address, true)).to.be.revertedWithCustomError(klab, 'NotOwner')
    await expect(klab.setExtension(bob.address, true)).to.emit(klab, 'ExtensionSet').withArgs(bob.address, true)
    await (await klab.setMintOpen(false)).wait() // an extension runs its own sale, even while the public mint is closed
    await expect(klab.connect(bob).extensionMint(carol.address, C(9, 4, 6, 7), 'Claimed', LOOK0, 500))
      .to.emit(klab, 'Transfer').withArgs(ethers.ZeroAddress, carol.address, 500n)
    expect(await klab.ownerOf(500)).to.equal(carol.address)
    await expect(klab.connect(bob).extensionMint(carol.address, C(9, 4, 6, 7), '', LOOK0, 501)).to.be.revertedWithCustomError(klab, 'ColoursTaken')
    await expect(klab.connect(bob).extensionMint(carol.address, C(9, 4, 6, 8), '', LOOK0, 0)).to.be.revertedWithCustomError(klab, 'BadNumber')
    await expect(klab.connect(bob).extensionMint(carol.address, C(9, 4, 6, 8), '', LOOK0, 8363)).to.be.revertedWithCustomError(klab, 'BadNumber')
    await expect(klab.connect(bob).extensionMint(carol.address, C(9, 4, 6, 8), 'K4NCUN0 2', LOOK0, 502)).to.be.revertedWithCustomError(klab, 'BadTitle')
    await expect(klab.connect(bob).extensionMint(ethers.ZeroAddress, C(9, 4, 6, 8), '', LOOK0, 502)).to.be.revertedWithCustomError(klab, 'ZeroAddress')
    await expect(klab.connect(bob).refreshMetadata(1, 8362)).to.emit(klab, 'BatchMetadataUpdate').withArgs(1n, 8362n)
    await expect(klab.refreshMetadata(500, 500)).to.emit(klab, 'MetadataUpdate').withArgs(500n)
    await expect(klab.connect(carol).refreshMetadata(1, 2)).to.be.revertedWithCustomError(klab, 'NotAuthorized')
    await (await klab.setMintOpen(true)).wait()
    await (await klab.setExtension(bob.address, false)).wait()
    await expect(klab.connect(bob).extensionMint(carol.address, C(9, 4, 6, 8), '', LOOK0, 502)).to.be.revertedWithCustomError(klab, 'NotAuthorized')
    await (await klab.setExtension(carol.address, true)).wait()
    await (await klab.lockExtensions()).wait()
    await expect(klab.setExtension(bob.address, true)).to.be.revertedWithCustomError(klab, 'Locked')
    await (await klab.setExtension(carol.address, false)).wait() // a bad extension can still be removed
    expect(await klab.isExtension(carol.address)).to.equal(false)

    // look operators: the holder lets an app set looks, and only looks
    await expect(klab.connect(alice).setLook(500, look(2, 2, 2, 2))).to.be.revertedWithCustomError(klab, 'NotAuthorized')
    await expect(klab.connect(carol).setLookOperator(alice.address, true)).to.emit(klab, 'LookOperatorSet').withArgs(carol.address, alice.address, true)
    await expect(klab.connect(alice).setLook(500, look(2, 2, 2, 2))).to.emit(klab, 'LookSet').withArgs(500n, 2n, alice.address, look(2, 2, 2, 2))
    await expect(klab.connect(alice).transferFrom(carol.address, alice.address, 500)).to.be.revertedWithCustomError(klab, 'NotAuthorized')
    expect(await klab.coloursOf(500)).to.equal(C(9, 4, 6, 7)) // a look never touches the colours
    await (await klab.connect(carol).setLookOperator(alice.address, false)).wait()
    await expect(klab.connect(alice).setLook(500, LOOK0)).to.be.revertedWithCustomError(klab, 'NotAuthorized')

    // the renderer decides which looks exist: today effects 0-8
    expect(await klab.validLook(look(8, 8, 8, 8, 3))).to.equal(true)
    expect(await klab.validLook(look(9, 0, 0, 0))).to.equal(await renderer.validLook(look(9, 0, 0, 0)))
    await expect(klab.connect(carol).setLook(500, look(0, 9, 0, 0))).to.be.revertedWithCustomError(klab, 'BadLook')
  })

  it('switches renderer (until locked) and tells marketplaces to refresh', async () => {
    const next = await (await ethers.getContractFactory('KLabRenderer')).deploy(await renderer.art(), await renderer.viewer())
    await expect(klab.setRenderer(alice.address)).to.be.revertedWithCustomError(klab, 'BadRenderer') // not a contract
    await expect(klab.setRenderer(await renderer.art())).to.be.reverted // a contract that is not a renderer
    await expect(klab.setRenderer(await next.getAddress())).to.emit(klab, 'BatchMetadataUpdate')
    await (await klab.lockRenderer()).wait()
    await expect(klab.setRenderer(await renderer.getAddress())).to.be.revertedWithCustomError(klab, 'Locked')
  })
})

describe('KLab deployers', function () {
  this.timeout(120000)
  it('deploy the collection in two transactions, with the logo as #0 for the sender', async () => {
    const [, , , , dave] = await ethers.getSigners()
    const A = await ethers.getContractFactory('KLabDeployArt')
    const B = await ethers.getContractFactory('KLabDeployCollection')
    console.log('      initcode:', (A.bytecode.length - 2) / 2, '+', (B.bytecode.length - 2) / 2, 'bytes (limit 49152 each)')
    const a = await A.connect(dave).deploy()
    const ra = await a.deploymentTransaction().wait()
    const ea = ra.logs.map(l => { try { return a.interface.parseLog(l) } catch { return null } }).find(e => e?.name === 'ArtDeployed')
    const b = await B.connect(dave).deploy(ea.args.art, ea.args.viewer)
    const rb = await b.deploymentTransaction().wait()
    console.log('      gas:', ra.gasUsed.toString(), '+', rb.gasUsed.toString())
    const eb = rb.logs.map(l => { try { return b.interface.parseLog(l) } catch { return null } }).find(e => e?.name === 'Deployed')
    const klab = await ethers.getContractAt('KLab', eb.args.klab)
    expect(await klab.owner()).to.equal(dave.address)
    expect(await klab.ownerOf(0)).to.equal(dave.address)
    expect(await klab.coloursOf(0)).to.equal(LOGO)
  })
})
