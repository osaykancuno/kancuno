import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Archivo, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Archivo (variable width + weight) for the editorial display type, JetBrains Mono for labels
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbmono', display: 'swap' })

const SITE = 'https://www.kancuno.com'
// Share link and search copy are about Osay only: no community names here
// (communities stay as context in the chapters, JSON-LD nodes and llms.txt).
const TITLE = 'KANCUNO - Artist & Builder'
const SHARE_DESCRIPTION =
  'Osay Kancuno (K4NCUN0) is an artist and builder on-chain. ' +
  'THE K.LAB: one symbol, infinite variations, with K1N0 on Ethereum.'
const DESCRIPTION =
  'Osay Kancuno (K4NCUN0, @OsayKancuno) is an artist and builder on-chain. ' +
  'He made THE K.LAB: free tools to design your own K, and K1N0, a fully on-chain collection on Ethereum. ' +
  'Also side quests like JAMVERSE, a live music universe in 3D, and games, tools and video for the communities he belongs to.'
const IMAGE_ALT = 'Osay Kancuno (K4NCUN0), artist and builder on-chain, with the K4NCUN0 logo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'Osay Kancuno',
  authors: [{ name: 'Osay Kancuno', url: SITE }],
  creator: 'Osay Kancuno',
  keywords: [
    'Osay Kancuno', 'K4NCUN0', 'Kancuno', '@OsayKancuno',
    'artist on-chain', 'on-chain artist', 'on-chain builder', 'on-chain art', 'pixel art',
    'JAMVERSE', 'on-chain experiments', 'off-chain experiments', '3D music studio', 'jam online with friends',
    'THE K.LAB', 'K1N0', 'K1N0 NFT', 'on-chain NFT', 'Kancuno K', 'pixel art editor', 'logo remix', 'creative framework',
    // secondary context
    'Normies Yacht Club', '8362 Coffee', 'The Normies', 'THE100', 'Normie #8362',
    'JPEG Frens', 'The Frens Forge', 'The Wall Arcade', 'FRENS AFTER DARK', 'NFC Summit', 'NFC 2027', 'NFC Summit Lisbon', 'On the Wall',
  ],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  openGraph: {
    type: 'profile',
    url: SITE,
    siteName: 'Osay Kancuno',
    title: TITLE,
    description: SHARE_DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: IMAGE_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@OsayKancuno',
    creator: '@OsayKancuno',
    title: TITLE,
    description: SHARE_DESCRIPTION,
    images: [{ url: '/og.png', alt: IMAGE_ALT }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fbc500',
}

// Structured data so search engines and AI assistants read the key facts directly.
const PERSON_ID = `${SITE}/#person`
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': PERSON_ID,
      name: 'Osay Kancuno',
      alternateName: ['K4NCUN0', 'Kancuno', '@OsayKancuno', 'osaykancuno'],
      url: SITE,
      image: `${SITE}/kancuno-logo.png`,
      jobTitle: 'Artist and builder on-chain',
      description: DESCRIPTION,
      memberOf: [
        {
          '@type': 'Organization',
          name: 'THE100 (The Normies)',
          description: 'THE100 group of The Normies community. Osay Kancuno is a member and holder.',
          parentOrganization: { '@type': 'Organization', name: 'The Normies', url: 'https://www.normies.art/' },
        },
        { '@id': `${SITE}/#jpegfrens` },
      ],
      brand: { '@id': `${SITE}/#8362coffee` },
      knowsAbout: ['On-chain art', 'Pixel art', 'On-chain building', 'Web3 community tools', 'Interactive 3D experiences'],
      sameAs: ['https://x.com/OsayKancuno', 'https://t.me/kancuno', 'https://onthewall.nfcsummit.com/people/k4ncun0'],
      subjectOf: {
        '@type': 'WebPage',
        name: 'K4NCUN0 · People of the wall, NFC Summit 2027 (Lisbon)',
        url: 'https://onthewall.nfcsummit.com/people/k4ncun0',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE}/#jamverse`,
      name: 'JAMVERSE',
      alternateName: 'Side quest 001',
      url: 'https://jamverse.kancuno.com/',
      description:
        'A live music universe in 3D: make a full song alone or jam it with friends in real time. ' +
        'Step sequencer, piano roll, arranger and mixer; export WAV, stems or MIDI. Free, in the browser. ' +
        'A side quest by Osay Kancuno, from a series of on-chain and off-chain experiments.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web browser',
      isAccessibleForFree: true,
      image: 'https://jamverse.kancuno.com/og-image.png',
      author: { '@id': PERSON_ID },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE}/klab#app`,
      name: 'THE K.LAB',
      url: `${SITE}/klab`,
      description:
        'By Osay Kancuno. One symbol, infinite variations: free browser tools to create, remix and animate art based on the Kancuno K, ' +
        'in 3D like the home page: K Editor, Pixel Forge, Animation Bench (GIF and video), SVG Suite, Touch Field and Image Wrap. Creation is off-chain, no wallet needed. ' +
        'Optional mint: K1N0, 8,362 Ks fully on-chain on Ethereum, four colours of your own that never change and a look you keep changing, kept on-chain with its story.',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web browser',
      isAccessibleForFree: true,
      image: `${SITE}/klab/og-lab.png`,
      author: { '@id': PERSON_ID },
    },
    {
      '@type': 'Organization',
      name: 'Normies Yacht Club',
      url: 'https://normiesyachtclub.com/',
      description: 'Pixel-art yachts that live entirely on Ethereum, each one born from a burned Normie, in a fleet with an end. CC0.',
      founder: { '@id': PERSON_ID },
    },
    {
      '@type': 'Brand',
      '@id': `${SITE}/#8362coffee`,
      name: '8362 Coffee',
      url: 'https://8362coffee.com/',
      description: 'A real-world coffee brand tied to Normie #8362, created by Osay Kancuno.',
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#jpegfrens`,
      name: 'JPEG Frens',
      description: 'NFT community. Osay Kancuno is a holder who contributes to the community with The Frens Forge and FRENS AFTER DARK.',
    },
    {
      '@type': 'VideoGame',
      '@id': `${SITE}/#frens-forge`,
      name: 'The Frens Forge',
      description: 'Burn-and-forge game for the JPEG Frens NFT community, on The Wall Arcade by SuperRare Studio.',
      url: 'https://kx499cjd.srstudio.dev/',
      author: { '@id': PERSON_ID },
      about: { '@id': `${SITE}/#jpegfrens` },
      gamePlatform: 'Web browser',
      isPartOf: { '@type': 'CreativeWork', name: 'The Wall Arcade', url: 'https://thewallarcade.superrare.com/' },
    },
    {
      '@type': 'CreativeWorkSeries',
      '@id': `${SITE}/#frens-after-dark`,
      name: 'FRENS AFTER DARK',
      description: 'Video mini-series for the JPEG Frens NFT community, on X. Seasons 1 and 2.',
      creator: { '@id': PERSON_ID },
      about: { '@id': `${SITE}/#jpegfrens` },
      inLanguage: 'en',
      hasPart: [
        {
          '@type': 'VideoObject',
          name: 'FRENS AFTER DARK, Season 1, Ep. 5: No Risk, No Sheet',
          url: 'https://x.com/OsayKancuno/status/2119116948881457640',
          uploadDate: '2026-11-07',
          creator: { '@id': PERSON_ID },
        },
        {
          '@type': 'VideoObject',
          name: 'FRENS AFTER DARK, Season 2, Ep. 5: Mint Condition',
          url: 'https://x.com/OsayKancuno/status/2121274266490388930',
          uploadDate: '2026-11-13',
          creator: { '@id': PERSON_ID },
        },
      ],
    },
    {
      '@type': 'ProfilePage',
      '@id': `${SITE}/#profile`,
      url: SITE,
      name: TITLE,
      mainEntity: { '@id': PERSON_ID },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${mono.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      </head>
      <body>
        {children}
        <Analytics />
        <Script id="clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wf04ptva0z");
        `}</Script>
      </body>
    </html>
  )
}
