// All copy and links for the site, in one place. Facts here must stay
// consistent with layout.tsx (metadata + JSON-LD), page.tsx and public/llms.txt.

export const LINKS = {
  x: 'https://x.com/OsayKancuno',
  telegram: 'https://t.me/kancuno',
  normies: 'https://www.normies.art/',
  normifesto: 'https://normifesto.netlify.app/',
  yachtClub: 'https://normiesyachtclub.com/',
  coffee: 'https://8362coffee.com/',
}

export const CHAPTER_LABELS = ['Intro', 'Profile', 'Works', 'Community', 'Contact'] as const

export const PROFILE = {
  handle: '@osaykancuno',
  tagline: 'On-chain vibecoding → off-chain experiences',
  bio: 'Builder on-chain, working on something new. Member and holder of THE100 in The Normies. We will change the world one pixel at a time.',
  quote: 'Culture belongs to the people who create it.',
  tags: ['Builder on-chain', 'THE100 holder', 'Normie #8362'],
  founderOf: [
    { label: 'Normies Yacht Club', href: LINKS.yachtClub },
    { label: '8362 Coffee', href: LINKS.coffee },
  ],
}

export interface Work {
  name: string
  type: string
  status?: string
  desc: string
  url: string
  cta: string
}

export const WORKS: Work[] = [
  {
    name: 'We Are All Normies',
    type: 'Tribute',
    status: 'Live',
    desc: 'A tribute NFT collection celebrating The Normies community. A collaborative 69x69 canvas.',
    url: 'https://opensea.io/collection/we-are-all-normies',
    cta: 'View on OpenSea',
  },
  {
    name: 'The Framework Library',
    type: 'Framework',
    status: 'Live',
    desc: 'A free Notion framework helping Web3 builders avoid common mistakes — built from real experience in the field.',
    url: 'https://kancuno.notion.site/THE-FRAMEWORK-LIBRARY-2e54fed9de0b80dcb5e3df60fb00432c',
    cta: 'Open framework',
  },
]

export const BOOA_NOTE = 'In collaboration with BOOA (formerly Khôra, @khorafun).'

export const BOOA_TOOLS: Work[] = [
  { name: 'MoltBOOA Lab', type: 'Agent simulator', url: 'http://moltbooa-lab.vercel.app', cta: 'Open', desc: 'Your agent has a life now: simulate, chat, battle, and export your BOOA to production.' },
  { name: 'Skill Synergy', type: 'Agent matcher', url: 'http://booa-skill-synergy.vercel.app', cta: 'Open', desc: 'Find the right match: the complementary skills of on-chain AI agents.' },
]

export const NORMIE_TOOLS: Work[] = [
  { name: 'Normies University', type: 'Agent academy', url: 'https://normie-university.vercel.app/', cta: 'Open', desc: 'Enroll your Normie as a learning agent: buy skill modules in USDC and earn on-chain soulbound credentials that build a composable reputation other protocols can read.' },
  { name: 'Air Normies', type: 'Gesture suite', url: 'https://air-normies.netlify.app/', cta: 'Open', desc: 'Touchless app suite: point and pinch with your fingers to control Normies tools — no keyboard, no mouse.' },
  { name: 'The Normies City', type: '3D cityscape', url: 'https://the-normies-city.vercel.app/', cta: 'Open', desc: 'Every Normie is a building in a 3D city — orbit from above, fly through, or drop into street view and walk.' },
  { name: 'Normie Sticker', type: 'AR studio', url: 'https://normie-sticker.vercel.app', cta: 'Open', desc: 'See your Normie in AR through your camera, pose it in the real world and export stickers or animated GIFs to share.' },
  { name: 'Video Normifier', type: 'Video → pixel', url: 'http://video-normifier.vercel.app', cta: 'Open', desc: 'Upload a clip or record from your camera and turn it into pixel art. Pick aspect ratio, color mode, resolution and frame rate, then download.' },
  { name: 'Super Normie', type: 'Platformer', url: 'http://super-normie-production.up.railway.app', cta: 'Open', desc: 'Run, jump and stomp enemies in a community platformer. Daily challenges, multiplayer mode and a global leaderboard.' },
  { name: 'NormieMap', type: '3D globe + chat', url: 'http://normie-map-production.up.railway.app', cta: 'Open', desc: 'Pin your Normie on a 3D globe as resident or traveler, link your X, chat in Normchat and watch the worldwide holder heatmap.' },
  { name: 'Normsky', type: 'Street art frames', url: 'http://normski-generator.vercel.app', cta: 'Open', desc: 'Type a Token ID and frame your Normie on a concrete, brick or plaster wall. Export still images or animated GIFs at any resolution.' },
]

export const MY_NORMIE = 'Normie #8362: my on-chain PFP. THE100 member and holder, part of the community since day 1.'

export const STATIONS = [
  { name: 'Lo-fi',   url: 'https://ice1.somafm.com/groovesalad-128-mp3' },
  { name: 'Ambient', url: 'https://ice1.somafm.com/dronezone-128-mp3' },
  { name: 'Indie',   url: 'https://ice1.somafm.com/indiepop-128-mp3' },
  { name: 'Space',   url: 'https://ice1.somafm.com/spacestation-128-mp3' },
  { name: 'Jazz',    url: 'https://ice1.somafm.com/sonicuniverse-128-mp3' },
]
