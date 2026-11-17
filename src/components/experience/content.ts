// All copy and links for the site, in one place. Facts here must stay
// consistent with layout.tsx (metadata + JSON-LD), page.tsx and public/llms.txt.

export const LINKS = {
  x: 'https://x.com/OsayKancuno',
  telegram: 'https://t.me/kancuno',
  normies: 'https://www.normies.art/',
  normifesto: 'https://normifesto.netlify.app/',
  yachtClub: 'https://normiesyachtclub.com/',
  coffee: 'https://8362coffee.com/',
  nfcWall: 'https://onthewall.nfcsummit.com/people/k4ncun0',
  nfcSummit: 'https://www.nfcsummit.com',
  jamverse: 'https://jamverse.kancuno.com/',
}

// Order matters: Osay first (profile, his own experiments), then the work he does for communities
export const CHAPTER_LABELS = ['Intro', 'Profile', 'Experiments', 'Communities', 'Contact'] as const

export const PROFILE = {
  handle: '@osaykancuno',
  tagline: 'On-chain vibecoding → off-chain experiences',
  bio: 'Artist and builder on-chain, working on something new. We will change the world one pixel at a time.',
  quote: 'Culture belongs to the people who create it.',
  tags: ['Artist', 'Builder on-chain', 'K4NCUN0'],
  founderOf: [
    { label: 'Normies Yacht Club', href: LINKS.yachtClub },
    { label: '8362 Coffee', href: LINKS.coffee },
  ],
}

export interface Work {
  name: string
  type: string
  community?: string // the community a work is made for (shown in the Communities chapter)
  status?: string
  desc: string
  url: string
  cta: string
  extra?: { label: string; url: string }[] // further links shown in the drawer
}

// ── Experiments: Osay's own series, on-chain and off-chain ────────────────
export const EXPERIMENTS_LEAD = 'A long series of experiments, on-chain and off-chain. The first one is live.'

export interface Experiment {
  code: string
  name: string
  kind: 'Off-chain' | 'On-chain'
  status: string
  tagline: string
  desc: string
  features: string[]
  url: string
  cta: string
  image: { src: string; width: number; height: number; alt: string }
}

export const EXPERIMENTS: Experiment[] = [
  {
    code: 'EXP. 001',
    name: 'JAMVERSE',
    kind: 'Off-chain',
    status: 'Live',
    tagline: 'Jam together in space.',
    desc: 'A live music universe in 3D. Make a full song alone or jam it with friends: every part is a ring you can step into.',
    features: [
      'Drums, bass, chords, melody, texture and voice are rings you can enter.',
      'The space reacts: harmony builds calm structures, clashes glitch until you resolve them.',
      'Jam live with pads, keys or a MIDI keyboard, friends join from a link in real time.',
      'A real studio: step sequencer, piano roll, song arranger and mixer.',
      'One tap turns a loop into a song, from intro to drop to outro.',
      'Export WAV, stems or MIDI, and play a new seed challenge every day.',
    ],
    url: 'https://jamverse.kancuno.com/',
    cta: 'Enter JAMVERSE',
    image: { src: '/experiments/jamverse.png', width: 1200, height: 630, alt: 'JAMVERSE: jam together in space' },
  },
]

// Placeholders for the series: shown as upcoming slots, never with invented names
export const EXPERIMENT_SLOTS = 3

// Work made for the communities Osay belongs to
export const WORKS: Work[] = [
  {
    name: 'The Frens Forge',
    type: 'Game',
    community: 'JPEG Frens',
    status: 'Live',
    desc: 'A burn-and-forge game for the JPEG Frens community, playable on The Wall Arcade by SuperRare Studio: arcade games built on the names of the NFC Summit wall in Lisbon.',
    url: 'https://kx499cjd.srstudio.dev/',
    cta: 'Play',
    extra: [
      { label: 'Play The Frens Forge', url: 'https://kx499cjd.srstudio.dev/' },
      { label: 'The Wall Arcade', url: 'https://thewallarcade.superrare.com/' },
    ],
  },
  {
    name: 'Frens After Dark',
    type: 'Video series',
    community: 'JPEG Frens',
    status: 'Seasons 1–2',
    desc: 'A video mini-series I make for the JPEG Frens community, as a holder. Two seasons so far, airing on X.',
    url: 'https://x.com/OsayKancuno/status/2121274266490388930',
    cta: 'Watch S2 Ep. 5',
    extra: [
      { label: 'S2 Ep. 5 “Mint Condition”', url: 'https://x.com/OsayKancuno/status/2121274266490388930' },
      { label: 'S1 Ep. 5 “No Risk, No Sheet”', url: 'https://x.com/OsayKancuno/status/2119116948881457640' },
    ],
  },
  {
    name: 'We Are All Normies',
    type: 'Tribute',
    community: 'The Normies',
    status: 'Live',
    desc: 'A tribute NFT collection celebrating The Normies community. A collaborative 69x69 canvas.',
    url: 'https://opensea.io/collection/we-are-all-normies',
    cta: 'View on OpenSea',
  },
]

// Osay's own resources (Profile drawer)
export const OWN_PROJECTS: Work[] = [
  {
    name: 'The Framework Library',
    type: 'Framework',
    status: 'Live',
    desc: 'A free Notion framework helping Web3 builders avoid common mistakes — built from real experience in the field.',
    url: 'https://kancuno.notion.site/THE-FRAMEWORK-LIBRARY-2e54fed9de0b80dcb5e3df60fb00432c',
    cta: 'Open framework',
  },
]

// NFC Summit 2027 (Lisbon): holder and community contributor, one of the People of the Wall (not a patron)
export const ON_THE_WALL = {
  short: 'On the wall at NFC Summit 2027',
  text: 'Holder and community contributor at NFC: one of the People of the Wall at NFC Summit 2027 (Lisbon, 27–29 May 2027, Unicorn Factory). K4NCUN0 is painted on the event’s wall: Panel #33, category Builders.',
  cta: 'See the panel',
  url: LINKS.nfcWall,
}


export const BOOA_TOOLS: Work[] = [
  { name: 'MoltBOOA Lab', community: 'BOOA', type: 'Agent simulator', url: 'http://moltbooa-lab.vercel.app', cta: 'Open', desc: 'Your agent has a life now: simulate, chat, battle, and export your BOOA to production.' },
  { name: 'Skill Synergy', community: 'BOOA', type: 'Agent matcher', url: 'http://booa-skill-synergy.vercel.app', cta: 'Open', desc: 'Find the right match: the complementary skills of on-chain AI agents.' },
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

// ── Community work: one tab per community, in the Communities chapter and drawer ──
export type CommunityId = 'jpegfrens' | 'normies' | 'booa'

export interface Community {
  id: CommunityId
  name: string
  role: string // Osay's place in the community, one or two sentences
  works: Work[]
  link?: { label: string; url: string } // a key community link next to the works
}

export const COMMUNITIES: Community[] = [
  {
    id: 'jpegfrens',
    name: 'JPEG Frens',
    role: 'Holder, contributing to the community with a game and a video series.',
    works: WORKS.filter(w => w.community === 'JPEG Frens'),
  },
  {
    id: 'normies',
    name: 'The Normies',
    role: 'THE100 member and holder since day 1, with Normie #8362 as on-chain PFP. I build free tools for the community.',
    works: [...WORKS.filter(w => w.community === 'The Normies'), ...NORMIE_TOOLS],
    link: { label: 'The Normifesto', url: LINKS.normifesto },
  },
  {
    id: 'booa',
    name: 'BOOA',
    role: 'In collaboration with BOOA (formerly Khôra, @khorafun): tools for on-chain AI agents.',
    works: BOOA_TOOLS,
  },
]

export const COMMUNITY_WORK_COUNT = COMMUNITIES.reduce((n, c) => n + c.works.length, 0)

export const STATIONS = [
  { name: 'Lo-fi',   url: 'https://ice1.somafm.com/groovesalad-128-mp3' },
  { name: 'Ambient', url: 'https://ice1.somafm.com/dronezone-128-mp3' },
  { name: 'Indie',   url: 'https://ice1.somafm.com/indiepop-128-mp3' },
  { name: 'Space',   url: 'https://ice1.somafm.com/spacestation-128-mp3' },
  { name: 'Jazz',    url: 'https://ice1.somafm.com/sonicuniverse-128-mp3' },
]
