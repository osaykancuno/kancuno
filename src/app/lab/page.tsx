import Link from 'next/link'
import { Zt } from '@/components/lab/Zt'
import { BaseDownloads, HeroK, SampleWall } from '@/components/lab/LabLanding'
import { KThumb } from '@/components/lab/KArt'
import { defaultDesign } from '@/lib/lab/design'
import { K1N0, MAX_SUPPLY, MINT_PRICE_ETH } from '@/lib/lab/onchain'
import { MintSoon } from '@/components/lab/MintSoon'
import './landing.css'

const TOOLS = [
  { code: 'T.01', name: 'K Editor', href: '/lab/editor', live: true, desc: 'Pick a part of the 3D K and change it: colours, gradients, patterns, neon, glitch, pixel. Export PNG, GLB, SVG.' },
  { code: 'T.02', name: 'Pixel Forge', href: '/lab/pixel', live: true, desc: 'Draw the K one pixel at a time, then see it as 3D voxels. Fixed grids, brand or free palettes.' },
  { code: 'T.03', name: 'Animation Bench', href: '/lab/animate', live: true, desc: 'Loops for the K: glow, bounce, head wave, blink, a full turn, pixel rain. Export GIF or video.' },
  { code: 'T.04', name: 'SVG Suite', href: '/lab/svg', live: true, desc: 'Render, clean and optimise the flat K as SVG. Download the base files of the framework.' },
  { code: 'T.05', name: 'Touch Field', href: '/lab/touch', live: true, desc: 'Move your pointer over the K and the blocks make way, like on the home page. Tune it, record it.' },
  { code: 'T.06', name: 'Image Wrap', href: '/lab/wrap', live: true, desc: 'Choose a picture and the 3D K wears it: across the figure or on every block, framed by you, in its own colours or the logo’s.' },
  { code: 'T.07', name: 'Prompt Lab', live: false, desc: 'Describe a K in words and get a design that follows the framework. Feed it your own JSON.' },
  { code: 'T.08', name: 'Gallery Wall', live: false, desc: 'A public wall of K’s made in the Lab, with likes, downloads and sharing on X.' },
  { code: 'T.09', name: 'Template Vault', href: '#framework', live: true, desc: 'Base files, wireframe, pixel grid and starter designs to build from.' },
  { code: 'T.10', name: 'K Arcade', live: false, desc: 'Small games and experiments starring the K.' },
] as const

const MODEL = [
  { layer: 'Off-chain', role: 'The Lab', text: 'Create and experiment. Free access, no wallet, no gas. Every tool and every export.' },
  { layer: 'Bridge', role: 'Mint this K', text: 'An optional button on every creation. Nothing changes if you never press it.' },
  { layer: 'On-chain', role: 'K1N0', text: `Your K in 3D on Ethereum, four colours that are yours alone, and a look you keep changing. ${MAX_SUPPLY.toLocaleString('en')} in all.` },
]

const ANATOMY = [
  { n: '01', name: 'Head', text: 'Seven blocks in three steps: two, three, two. The front row sits highest.' },
  { n: '02', name: 'Body', text: 'The X: two bars crossing under the head.' },
  { n: '03', name: 'Field', text: 'The floor the K stands on. Any colour, gradient or pattern.' },
  { n: '04', name: 'Light', text: 'One soft key light from the top left, like the home page.' },
]

export default function LabHome() {
  return (
    <div className="kl">
      {/* ── Hero ── */}
      <section className="kl-hero" aria-labelledby="kl-title">
        <div className="kl-hero__copy">
          <p className="lab-label kl-eyebrow">THE K.LAB · by K4NCUN0</p>
          <h1 id="kl-title" className="kl-hero__title">
            <span>One symbol.</span>
            <span>Infinite variations.</span>
          </h1>
          <p className="kl-lead">
            THE K.LAB turns the Kancuno character into an open creative framework.
            <br />Create, remix and animate your own K with free tools in the browser.
            <br />Free to create, no wallet. Mint it as a <Zt>K1N0</Zt> if you want it on-chain.
          </p>
          <div className="kl-cta">
            <Link href="/lab/editor" className="lab-btn lab-btn--primary">Enter the Lab <span aria-hidden="true">→</span></Link>
            <a href="#framework" className="lab-btn lab-btn--ghost">Get the base files</a>
          </div>
          <p className="kl-prompt lab-label" aria-hidden="true">&gt; one pixel at a time_</p>
        </div>
        <HeroK />
      </section>

      {/* ── What is ── */}
      <section className="kl-sec" id="what" aria-labelledby="kl-what">
        <header className="kl-sec__head">
          <span className="lab-label">01 · What is THE K.LAB</span>
          <h2 id="kl-what" className="kl-h2">A lab, not a protocol.</h2>
        </header>
        <div className="kl-two">
          <div className="kl-text">
            <p>The K is a simple, strong form: seven blocks for a head, an X for a body.</p>
            <p>Keep it recognisable, then change everything else.</p>
            <p>It lives in 3D, built exactly like the figure on the home page, and in a flat version for vector files.</p>
            <p>Every tool runs in your browser and exports files that are yours.</p>
            <p>Creation is off-chain and free. Minting is an option, never a requirement.</p>
          </div>
          <dl className="kl-model" aria-label="How the Lab works, off-chain and on-chain">
            {MODEL.map(m => (
              <div key={m.layer} className="kl-model__row">
                <dt className="kl-model__layer">{m.layer}</dt>
                <dd className="kl-model__role"><Zt>{m.role}</Zt></dd>
                <dd className="kl-model__text">{m.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Tools ── */}
      <section className="kl-sec" id="tools" aria-labelledby="kl-tools">
        <header className="kl-sec__head">
          <span className="lab-label">02 · Tools</span>
          <h2 id="kl-tools" className="kl-h2">The suite.</h2>
        </header>
        <ul className="kl-tools">
          {TOOLS.map(t => {
            const inner = (
              <>
                <span className="kl-tool__top">
                  <span className="lab-label">{t.code}</span>
                  {t.live ? <span className="lab-live">Live</span> : <span className="lab-soon">Soon</span>}
                </span>
                <span className="kl-tool__name">{t.name}</span>
                <span className="kl-tool__desc">{t.desc}</span>
                {t.live && <span className="kl-tool__go" aria-hidden="true">Open →</span>}
              </>
            )
            return (
              <li key={t.code}>
                {'href' in t && t.live ? (
                  <Link href={t.href} className="kl-tool">{inner}</Link>
                ) : (
                  <div className="kl-tool kl-tool--soon">{inner}</div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── Framework ── */}
      <section className="kl-sec" id="framework" aria-labelledby="kl-fw">
        <header className="kl-sec__head">
          <span className="lab-label">03 · The Framework</span>
          <h2 id="kl-fw" className="kl-h2">The base form.</h2>
        </header>
        <div className="kl-fw">
          <div className="kl-fw__art">
            <div className="kl-fw__pair">
              <KThumb design={defaultDesign()} alt="The original K in 3D: black and pink and purple clay blocks over a black X, on yellow" size={480} />
              <KThumb design={{ ...defaultDesign(), view: 'flat' }} alt="The flat K: the same figure as a 2D vector mark" size={480} />
            </div>
            <ol className="kl-anatomy">
              {ANATOMY.map(a => (
                <li key={a.n}><span className="lab-label">{a.n}</span><strong>{a.name}</strong><span>{a.text}</span></li>
              ))}
            </ol>
          </div>
          <div className="kl-fw__side">
            <h3 className="kl-h3">Light rules</h3>
            <dl className="kl-rules">
              <div><dt>Keep</dt><dd>The figure stays recognisable: seven head blocks, one X.</dd></div>
              <div><dt>Prefer</dt><dd>Clay 3D, pixel art, neon, high contrast.</dd></div>
              <div><dt>Free</dt><dd>Colours, textures, effects, accessories and backgrounds. All of it.</dd></div>
            </dl>
            <h3 className="kl-h3">Base files</h3>
            <BaseDownloads />
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="kl-sec" id="gallery" aria-labelledby="kl-gal">
        <header className="kl-sec__head">
          <span className="lab-label">04 · Gallery Wall <span className="lab-soon">Opening soon</span></span>
          <h2 id="kl-gal" className="kl-h2">Made in the Lab.</h2>
          <p className="kl-sub">A public wall for your K’s is coming. Minted pieces will carry an On-chain badge.<br />Until then, start from one of these: click one to open it in the editor.</p>
        </header>
        <SampleWall />
      </section>

      {/* ── Mint flow ── */}
      <section className="kl-sec" id="mint" aria-labelledby="kl-mint">
        <header className="kl-sec__head">
          <span className="lab-label">05 · Mint · K1N0 <MintSoon /></span>
          <h2 id="kl-mint" className="kl-h2">Your colours. A look that lives.</h2>
          <p className="kl-sub">{MAX_SUPPLY.toLocaleString('en')} <Zt>K1N0</Zt> in all, {MINT_PRICE_ETH} ETH each, fully on-chain on Ethereum. Yours to design, yours to keep changing.</p>
        </header>
        <ol className="kl-steps kl-steps--four">
          <li><span className="kl-steps__n">01</span><strong>Create</strong><span>Make your K in any tool of the Lab. Free, no wallet.</span></li>
          <li><span className="kl-steps__n">02</span><strong>Four colours</strong><span>The background, the centre block and the two front blocks, from the 16 below; the X and four blocks stay black. Each combination can be minted once.</span></li>
          <li><span className="kl-steps__n">03</span><strong>Mint this K</strong><span>Pick your number or press Random. One confirmation; the Lab tells you first if the colours are still free.</span></li>
          <li><span className="kl-steps__n">04</span><strong>Give it a look</strong><span>An effect for each colour, the speed, the view; the colours stay as minted. Gas only, as often as you like. The new look shows on-chain and on OpenSea, every look stays in its story, and the story goes on with the next holder.</span></li>
        </ol>
        <div className="kl-palette" aria-label="The K1N0 palette: 16 colours">
          {K1N0.map(c => <i key={c} style={{ background: c }} title={c} />)}
        </div>
        <p className="kl-sub">Minting is optional: the Lab works 100% without it. Nobody votes on your K.</p>
      </section>

      {/* ── How it works ── */}
      <section className="kl-sec" id="how" aria-labelledby="kl-how">
        <header className="kl-sec__head">
          <span className="lab-label">06 · How it works</span>
          <h2 id="kl-how" className="kl-h2">Five steps.</h2>
        </header>
        <ol className="kl-steps kl-steps--five">
          <li><span className="kl-steps__n">01</span><strong>Open a tool</strong><span>Start with the K Editor or Pixel Forge.</span></li>
          <li><span className="kl-steps__n">02</span><strong>Pick a start</strong><span>The original K, a preset or a remix.</span></li>
          <li><span className="kl-steps__n">03</span><strong>Remix</strong><span>Colours, patterns, effects, motion.</span></li>
          <li><span className="kl-steps__n">04</span><strong>Export</strong><span>PNG, SVG, GIF, video or JSON to reload later.</span></li>
          <li><span className="kl-steps__n">05</span><strong>Share</strong><span>Post it on X and tag @OsayKancuno.</span></li>
        </ol>
        <div className="kl-cta">
          <Link href="/lab/editor" className="lab-btn lab-btn--primary">Enter the Lab <span aria-hidden="true">→</span></Link>
          <a href="https://x.com/OsayKancuno" className="lab-btn" target="_blank" rel="noopener noreferrer">Follow on X<span className="lab-sr"> (opens in a new tab)</span></a>
          <a href="https://t.me/kancuno" className="lab-btn lab-btn--ghost" target="_blank" rel="noopener noreferrer">Telegram<span className="lab-sr"> (opens in a new tab)</span></a>
        </div>
      </section>
    </div>
  )
}
