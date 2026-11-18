// Deploys THE K.LAB to a running local node (npx hardhat node) and prints the KLab address.
const { ethers } = require('hardhat')
async function main() {
  const [me] = await ethers.getSigners()
  const A = await ethers.getContractFactory('KLabDeployArt')
  const a = await A.deploy()
  const ra = await a.deploymentTransaction().wait()
  const ea = ra.logs.map(l => { try { return a.interface.parseLog(l) } catch { return null } }).find(e => e?.name === 'ArtDeployed')
  const B = await ethers.getContractFactory('KLabDeployCollection')
  const b = await B.deploy(ea.args.art, ea.args.viewer)
  const rb = await b.deploymentTransaction().wait()
  const eb = rb.logs.map(l => { try { return b.interface.parseLog(l) } catch { return null } }).find(e => e?.name === 'Deployed')
  console.log('KLAB_ADDRESS=' + eb.args.klab, 'owner', me.address)
}
main().catch(e => { console.error(e); process.exit(1) })
