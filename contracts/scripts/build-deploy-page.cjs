// Builds deploy/index.html: a local page that deploys THE K.LAB contracts from the owner's own
// wallet (KLabArt → KLabRenderer(art) → KLab(renderer)). The bytecode comes from `hardhat compile`;
// keys never leave the wallet. Also writes deploy/verify/*.json for Etherscan verification.
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const art = (file, name) => JSON.parse(fs.readFileSync(path.join(root, 'artifacts/src', file, `${name}.json`), 'utf8'))
const code = {
  KLabDeployArt: art('KLabDeployer.sol', 'KLabDeployArt').bytecode,
  KLabDeployCollection: art('KLabDeployer.sol', 'KLabDeployCollection').bytecode,
  KLabArtBg: art('KLabArt3D.sol', 'KLabArtBg').bytecode,
  KLabArt3D: art('KLabArt3D.sol', 'KLabArt3D').bytecode,
  KLabViewer: art('KLabViewer.sol', 'KLabViewer').bytecode,
  KLabRenderer: art('KLabRenderer.sol', 'KLabRenderer').bytecode,
  KLab: art('KLab.sol', 'KLab').bytecode,
}
const { id } = require('ethers')

// Standard JSON input for Etherscan ("Solidity (Standard-Json-Input)")
const infoDir = path.join(root, 'artifacts/build-info')
// the latest build: it holds all three contracts as compiled for the bytecode above
const latest = fs.readdirSync(infoDir).map(f => path.join(infoDir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0]
const info = JSON.parse(fs.readFileSync(latest, 'utf8'))
fs.mkdirSync(path.join(root, 'deploy/verify'), { recursive: true })
fs.writeFileSync(path.join(root, 'deploy/verify/standard-input.json'), JSON.stringify(info.input, null, 1))
fs.writeFileSync(path.join(root, 'deploy/verify/README.txt'), `Compiler: v${info.solcLongVersion}\nOptimizer: on, 200 runs, viaIR, EVM cancun\nOn Etherscan: Verify & Publish → Solidity (Standard-Json-Input) → upload standard-input.json.\nContracts: src/KLabArt3D.sol:KLabArtBg (no args), src/KLabArt3D.sol:KLabArt3D (bg), src/KLabViewer.sol:KLabViewer (no args), src/KLabRenderer.sol:KLabRenderer (art, viewer), src/KLab.sol:KLab (renderer, owner, 0x00030202, "K4NCUN0"). On Ethereum they come from src/KLabDeployer.sol (KLabDeployArt, then KLabDeployCollection(art, viewer)).\n`)

const tpl = fs.readFileSync(path.join(__dirname, 'deploy-template.html'), 'utf8')
fs.writeFileSync(path.join(root, 'deploy/index.html'), tpl.replace('/*__CODE__*/{}', JSON.stringify(code)).replace('__TOPIC_ART__', id('ArtDeployed(address,address)')).replace('__TOPIC_COLL__', id('Deployed(address,address,address)')))
console.log('deploy/index.html written', Object.fromEntries(Object.entries(code).map(([k, v]) => [k, (v.length - 2) / 2 + ' bytes'])))


// deploy/owner.html: retire the first contract, launch, withdraw (owner only)
fs.copyFileSync(path.join(__dirname, 'owner-template.html'), path.join(root, 'deploy/owner.html'))
console.log('deploy/owner.html written')
