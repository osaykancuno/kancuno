// Writes out/viewer/*.html: the 3D piece for sample K1N0 (colours + look), for a visual check.
const fs = require('fs'), path = require('path')
const js = fs.readFileSync(path.join(__dirname, 'viewer.js'), 'utf8')
const out = path.join(__dirname, '..', 'out', 'viewer'); fs.mkdirSync(out, { recursive: true })
// colours: bg, top, centre, front · look: bgFx, topFx, centreFx, frontFx, speed, yaw, pitch, zoom
const samples = {
  logo: ['00010302', '0000000001004a64'],
  glow: ['0e060d00', '01010205020a3c64'],
  neon: ['01' === '' ? '' : '0e0d060f', '06060606020e3a6e'.replace(/^06/, '06')],
  metal: ['04070a0b', '07070807010046' + '64'],
  float: ['0a040b0e', '05040304020c4a64'],
}
samples.neon = ['0e0d060f', '06060606020e3a6e']
const page = (c, l) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}canvas{width:100%;height:100%;display:block;touch-action:none;cursor:grab}</style></head><body><canvas id="c"></canvas><script>const D="${c}${l}000100";${js}</script></body></html>`
for (const [n, [c, l]] of Object.entries(samples)) fs.writeFileSync(path.join(out, `v3-${n}.html`), page(c, l))
fs.writeFileSync(path.join(out, 'v3.html'), `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px;height:100vh;box-sizing:border-box">${Object.keys(samples).map(n => `<iframe src="v3-${n}.html" style="border:0;width:100%;height:100%"></iframe>`).join('')}`)
console.log('out/viewer/v3.html')
