require('@nomicfoundation/hardhat-ethers')
require('@nomicfoundation/hardhat-chai-matchers')

/** THE K.LAB contracts. `npm test` runs the suite on Hardhat's in-process network. */
module.exports = {
  solidity: {
    version: '0.8.28',
    settings: { viaIR: true, optimizer: { enabled: true, runs: 200 }, evmVersion: 'cancun' },
  },
  paths: { sources: './src', tests: './test', cache: './cache', artifacts: './artifacts' },
  networks: {
    hardhat: { blockGasLimit: 60_000_000, chainId: process.env.HH_CHAIN_ID ? Number(process.env.HH_CHAIN_ID) : 31337 },
    // test runs only: a throwaway key in KLAB_TEST_KEY (never a real wallet, never mainnet)
    sepolia: { url: 'https://ethereum-sepolia-rpc.publicnode.com', chainId: 11155111, gas: 15_000_000, gasPrice: 20_000_000 /* 0.02 gwei: Sepolia's base fee is near zero */, accounts: process.env.KLAB_TEST_KEY ? [process.env.KLAB_TEST_KEY] : [] },
  },
}
