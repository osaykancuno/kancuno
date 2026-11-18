// TEST ONLY. A local JSON-RPC endpoint that signs with a throwaway key (KLAB_TEST_KEY) and forwards
// everything else to Sepolia, so the deploy page and the site can be exercised end to end.
// Refuses any chain but Sepolia. Never run it with a real wallet's key.
const http = require('http')
const { ethers } = require('ethers')
const RPC = 'https://ethereum-sepolia-rpc.publicnode.com'
const provider = new ethers.JsonRpcProvider(RPC, 11155111)
const wallet = new ethers.Wallet(process.env.KLAB_TEST_KEY, provider)
const forward = async body => (await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json()
http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'content-type')
  if (req.method === 'OPTIONS') return res.end()
  let raw = ''; for await (const c of req) raw += c
  const body = JSON.parse(raw)
  const reply = result => res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }))
  try {
    if (body.method === 'eth_requestAccounts' || body.method === 'eth_accounts') return reply([wallet.address.toLowerCase()])
    if (body.method === 'eth_chainId') return reply('0xaa36a7')
    if (body.method === 'wallet_switchEthereumChain') {
      if (body.params?.[0]?.chainId !== '0xaa36a7') throw new Error('Test signer: Sepolia only.')
      return reply(null)
    }
    if (body.method === 'eth_sendTransaction') {
      const t = body.params[0]
      const tx = await wallet.sendTransaction({ to: t.to || null, data: t.data, value: t.value ? BigInt(t.value) : 0n })
      console.log('signed', tx.hash, t.to ? 'call' : 'deploy')
      return reply(tx.hash)
    }
    const j = await forward(body)
    res.end(JSON.stringify(j))
  } catch (e) {
    res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, error: { code: -32000, message: e.shortMessage || e.message, data: e.data } }))
  }
}).listen(8548, '127.0.0.1', () => console.log('test signer on http://127.0.0.1:8548 for', wallet.address))
