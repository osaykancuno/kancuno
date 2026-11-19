// Rehearsal of the renderer update on a local copy of Ethereum mainnet (nothing reaches mainnet):
//   FORK_URL=https://ethereum-rpc.publicnode.com npx hardhat run scripts/renderer2-fork-check.cjs
// Deploys KLabRenderer2 with the live KLabArt3D and KLabViewer, switches the live K1N0 contract to
// it as its owner (impersonated on the fork), and checks the metadata that would result.
const { ethers, network } = require('hardhat')

const KLAB = '0x25c8518e54b7cbb6cfe16d11bda5d543fb9e397f'
const json = uri => JSON.parse(Buffer.from(uri.split(',')[1], 'base64').toString('utf8'))

;(async () => {
  if (!network.config.forking?.url) throw new Error('Set FORK_URL to a mainnet RPC.')
  const klab = await ethers.getContractAt('KLab', KLAB)
  const owner = await klab.owner()
  const r1 = await ethers.getContractAt('KLabRenderer', await klab.renderer())
  const [art, viewer] = [await r1.art(), await r1.viewer()]
  console.log({ owner, renderer: await r1.getAddress(), art, viewer, locked: await klab.rendererLocked(), supply: String(await klab.totalSupply()) })

  const before = json(await klab.tokenURI(0))
  const f = await ethers.getContractFactory('KLabRenderer2')
  const deployTx = await f.getDeployTransaction(art, viewer)
  const deployGas = await ethers.provider.estimateGas({ ...deployTx, from: owner })

  await network.provider.request({ method: 'hardhat_impersonateAccount', params: [owner] })
  await network.provider.request({ method: 'hardhat_setBalance', params: [owner, '0x56BC75E2D63100000'] })
  const signer = await ethers.getSigner(owner)
  const r2 = await (await f.connect(signer).deploy(art, viewer)).waitForDeployment()
  const setData = klab.interface.encodeFunctionData('setRenderer', [await r2.getAddress()])
  const setGas = await ethers.provider.estimateGas({ from: owner, to: KLAB, data: setData })
  await (await klab.connect(signer).setRenderer(await r2.getAddress())).wait()

  const after = json(await klab.tokenURI(0))
  const c = json(await klab.contractURI())
  const same = before.image === after.image && before.animation_url === after.animation_url && JSON.stringify(before.attributes) === JSON.stringify(after.attributes)
  const fee = (await ethers.provider.send('eth_gasPrice', []))
  console.log({
    sameArtAndTraits: same,
    tokenDescription: after.description,
    externalUrl: after.external_url,
    collectionDescription: c.description,
    collectionLink: c.external_link,
    gas: { deploy: String(deployGas), setRenderer: String(setGas), gasPriceGwei: Number(BigInt(fee)) / 1e9 },
    estimatedEth: Number((deployGas + setGas) * BigInt(fee)) / 1e18,
  })
  if (!same) process.exit(1)
})().catch(e => { console.error(e); process.exit(1) })
