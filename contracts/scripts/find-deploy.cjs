// After the owner deployed from the deploy page (two transactions on mainnet), find the new K1N0
// contract from the owner's address alone: the second deployer was created at the owner's last-but-
// one nonce, and it created the renderer (its nonce 1) then KLab (its nonce 2). Read-only.
//   node scripts/find-deploy.cjs <owner address> [rpc]
const { ethers } = require('ethers')
;(async () => {
  const owner = process.argv[2]
  const p = new ethers.JsonRpcProvider(process.argv[3] || 'https://ethereum-rpc.publicnode.com')
  const nonce = await p.getTransactionCount(owner)
  const abi = ['function name() view returns (string)', 'function owner() view returns (address)', 'function ownerOf(uint256) view returns (address)', 'function coloursOf(uint256) view returns (bytes4)', 'function mintOpen() view returns (bool)']
  for (let n = nonce - 1; n >= Math.max(0, nonce - 12); n--) {
    const deployer = ethers.getCreateAddress({ from: owner, nonce: n })
    // two-step deploy: KLab is the deployer's second contract; one by one: KLab came from the wallet itself
    for (const klab of [ethers.getCreateAddress({ from: deployer, nonce: 2 }), deployer]) try {
      const k = new ethers.Contract(klab, abi, p)
      if ((await k.name()) !== 'THE K.LAB' || (await k.owner()).toLowerCase() !== owner.toLowerCase()) continue
      if ((await k.coloursOf(0)) !== '0x00030202') continue
      console.log(JSON.stringify({ klab, logoOwner: await k.ownerOf(0), mintOpen: await k.mintOpen() }))
      return
    } catch { /* not this one */ }
  }
  console.log('NOT FOUND')
})()
