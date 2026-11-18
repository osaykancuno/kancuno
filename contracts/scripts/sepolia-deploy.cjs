// TEST ONLY: deploys THE K.LAB to Sepolia one contract per transaction (Sepolia's per-byte code
// pricing and per-transaction cap rule out the two-step mainnet deploy). Prints the KLab address.
const { ethers, network } = require('hardhat')
async function main() {
  if (network.name !== 'sepolia') throw new Error('Sepolia only')
  const [me] = await ethers.getSigners()
  // the lowest fee that still gets mined: base + base/4 + a 0.01 gwei tip (hardhat's default tip is 1 gwei)
  const fees = async () => {
    const base = (await ethers.provider.getBlock('latest')).baseFeePerGas
    const tip = ethers.parseUnits('0.01', 'gwei')
    return { maxPriorityFeePerGas: tip, maxFeePerGas: base + base / 4n + tip }
  }
  const done = JSON.parse(process.env.KLAB_RESUME || '{}') // resume: {"KLabArtBg":"0x…",…}
  const step = async (name, ...args) => {
    if (done[name]) { console.log(' ', name, done[name], '(already deployed)'); return done[name] }
    const c = await (await ethers.getContractFactory(name)).deploy(...args, await fees())
    await c.deploymentTransaction().wait(2)
    const a = await c.getAddress()
    console.log(' ', name, a)
    return a
  }
  const bg = await step('KLabArtBg')
  const art = await step('KLabArt3D', bg)
  const viewer = await step('KLabViewer')
  const renderer = await step('KLabRenderer', art, viewer)
  const klab = await step('KLab', renderer, me.address, '0x00030202', 'K4NCUN0')
  console.log('KLAB_ADDRESS=' + klab)
}
main().catch(e => { console.error(e); process.exit(1) })
