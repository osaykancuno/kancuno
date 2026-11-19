// KLabRenderer2: the same art, 3D piece and traits as KLabRenderer, with the words aligned to what
// K1N0 is today (an open character with no owner, CC0) and links to kancuno.com/klab.
const { expect } = require('chai')
const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

const PRICE = ethers.parseEther('0.0024')
const OUT = path.join(__dirname, '..', 'out', 'renderer2')
const LOGO = '0x00030202'
const C = (...i) => '0x' + i.map(v => v.toString(16).padStart(2, '0')).join('')
const look = (bg, c, l, r, speed = 1, yaw = 0, pitch = 74, zoom = 100) => C(bg, c, l, r, speed, (yaw + 256) % 256, pitch, zoom)
const json = uri => JSON.parse(Buffer.from(uri.split(',')[1], 'base64').toString('utf8'))

describe('KLabRenderer2 · aligned words, same art', function () {
  this.timeout(180000)
  let klab, r1, r2, owner, alice

  before(async () => {
    ;[owner, alice] = await ethers.getSigners()
    const f = n => ethers.getContractFactory(n)
    const bg = await (await f('KLabArtBg')).deploy()
    const art = await (await f('KLabArt3D')).deploy(await bg.getAddress())
    const viewer = await (await f('KLabViewer')).deploy()
    r1 = await (await f('KLabRenderer')).deploy(await art.getAddress(), await viewer.getAddress())
    r2 = await (await f('KLabRenderer2')).deploy(await r1.art(), await r1.viewer())
    klab = await (await f('KLab')).deploy(await r1.getAddress(), owner.address, LOGO, 'K4NCUN0')
    await (await klab.setMintOpen(true)).wait()
    await (await klab.connect(alice).mint(C(6, 13, 0, 0), 'Neon friend', look(0, 0, 0, 0), 1, { value: PRICE })).wait()
    await (await klab.connect(alice).mint(C(14, 0, 2, 4), '', look(5, 1, 6, 7, 2, -40, 60, 120), 8362, { value: PRICE })).wait()
    await (await klab.connect(alice).setLook(1, look(3, 2, 4, 8, 3, 30, 80, 90))).wait()
    fs.mkdirSync(OUT, { recursive: true })
  })

  it('reuses the same art and 3D piece and accepts the default look', async () => {
    expect(await r2.art()).to.equal(await r1.art())
    expect(await r2.viewer()).to.equal(await r1.viewer())
    expect(await r2.validLook('0x0000000001004a64')).to.equal(true)
    for (const l of ['0x0900000001004a64', '0x0000000004004a64', '0x0000000001001364', '0x000000000100bfbf']) expect(await r2.validLook(l)).to.equal(await r1.validLook(l))
  })

  it('changes only the words: image, 3D piece, name and traits stay identical', async () => {
    const before = {}
    for (const id of [0, 1, 8362]) before[id] = json(await klab.tokenURI(id))
    const cBefore = json(await klab.contractURI())
    await expect(klab.setRenderer(await r2.getAddress())).to.emit(klab, 'BatchMetadataUpdate')
    for (const id of [0, 1, 8362]) {
      const a = before[id]
      const b = json(await klab.tokenURI(id)) // JSON.parse throws on any broken JSON
      expect(b.name).to.equal(a.name)
      expect(b.image).to.equal(a.image)
      expect(b.animation_url).to.equal(a.animation_url)
      expect(b.attributes).to.deep.equal(a.attributes)
      expect(b.external_url).to.equal(`https://www.kancuno.com/klab/token?id=${id}`)
      expect(b.description).to.contain('open character with no owner, public domain under CC0')
      // the words of the renderer (a token's own title, chosen at mint, comes first and is kept as it is)
      const words = b.description.replace(/^“[^”]*” · /, '')
      expect(words).to.not.match(/Kancuno K|logo|K4NCUN0/i)
      expect(b.description).to.contain('Its four colours are its own')
      expect(b.description).to.contain('Fully on-chain on Ethereum')
      fs.writeFileSync(path.join(OUT, `token-${id}.json`), JSON.stringify({ ...b, image: b.image.slice(0, 40) + '…', animation_url: b.animation_url.slice(0, 40) + '…' }, null, 2))
    }
    const d0 = json(await klab.tokenURI(0)).description
    expect(d0.startsWith('“K4NCUN0” · K1N0 #0, the first K1N0, minted with the collection.')).to.equal(true) // its on-chain title stays
    const d1 = json(await klab.tokenURI(1)).description
    expect(d1.startsWith('“Neon friend” · K1N0 #1 of 8,362 from THE K.LAB.')).to.equal(true)
    expect(d1).to.contain('(this K1N0 has had 2 looks)')
    expect(json(await klab.tokenURI(8362)).description.startsWith('K1N0 #8362 of 8,362 from THE K.LAB.')).to.equal(true)

    const c = json(await klab.contractURI())
    expect(c.name).to.equal(cBefore.name)
    expect(c.external_link).to.equal('https://www.kancuno.com/klab')
    expect(c.description).to.contain('open character with no owner, public domain under CC0')
    expect(c.description).to.not.match(/Kancuno K|logo|K4NCUN0/i)
    expect(c.image.startsWith('data:image/svg+xml;base64,')).to.equal(true)
    const svg = Buffer.from(c.image.split(',')[1], 'base64').toString('utf8')
    expect(svg).to.contain('<title>K1N0 · THE K.LAB</title>')
    fs.writeFileSync(path.join(OUT, 'contract.json'), JSON.stringify({ ...c, image: c.image.slice(0, 40) + '…' }, null, 2))
  })

  it('keeps working for holders: a new look shows in the new metadata', async () => {
    await (await klab.connect(alice).setLook(8362, look(1, 1, 1, 1))).wait()
    const m = json(await klab.tokenURI(8362))
    expect(m.attributes.find(a => a.trait_type === 'Background effect').value).to.equal('Glow')
    expect(m.description).to.contain('(this K1N0 has had 2 looks)')
  })

  it('can go back to the first renderer (until locked)', async () => {
    await (await klab.setRenderer(await r1.getAddress())).wait()
    expect(json(await klab.tokenURI(1)).external_url).to.equal('https://www.kancuno.com/lab/token?id=1')
  })
})
