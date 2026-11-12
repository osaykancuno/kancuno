import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Archivo, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Archivo (variable width + weight) for the editorial display type, JetBrains Mono for labels
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbmono', display: 'swap' })

const SITE = 'https://www.kancuno.com'
const TITLE = 'Osay Kancuno — Builder On-Chain · K4NCUN0'
const DESCRIPTION =
  'Osay Kancuno (K4NCUN0, @OsayKancuno) is an on-chain builder, currently building something new. ' +
  'Member and holder of THE100 in The Normies (Normie #8362). ' +
  'JPEG Frens holder, creator of The Frens Forge and FRENS AFTER DARK; on the wall at NFC Summit 2027. ' +
  'Founder of Normies Yacht Club and 8362 Coffee.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'Osay Kancuno',
  authors: [{ name: 'Osay Kancuno', url: SITE }],
  creator: 'Osay Kancuno',
  keywords: [
    'Osay Kancuno', 'K4NCUN0', 'Kancuno',
    'The Normies', 'THE100', 'Normies THE100', 'Normie #8362', 'on-chain builder', 'on-chain NFT',
    'pixel art NFT', 'Normies Yacht Club', '8362 Coffee',
    'JPEG Frens', 'The Frens Forge', 'The Wall Arcade', 'FRENS AFTER DARK', 'NFC Summit', 'NFC 2027', 'NFC Summit Lisbon', 'On the Wall',
  ],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  openGraph: {
    type: 'profile',
    url: SITE,
    siteName: 'Osay Kancuno',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Osay Kancuno (K4NCUN0), builder on-chain, with the K4NCUN0 logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@OsayKancuno',
    creator: '@OsayKancuno',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og.png', alt: 'Osay Kancuno (K4NCUN0), builder on-chain, with the K4NCUN0 logo' }],
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
      alternateName: ['K4NCUN0', 'Kancuno', '@OsayKancuno', 'osaykancuno', 'Normie #8362'],
      url: SITE,
      image: `${SITE}/kancuno-logo.png`,
      jobTitle: 'On-chain builder',
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
      knowsAbout: ['The Normies', 'JPEG Frens', 'On-chain NFT art', 'Pixel art', 'Vibecoding', 'Web3 community tools'],
      sameAs: ['https://x.com/OsayKancuno', 'https://t.me/kancuno', 'https://onthewall.nfcsummit.com/people/k4ncun0'],
      subjectOf: {
        '@type': 'WebPage',
        name: 'K4NCUN0 · People of the wall, NFC Summit 2027 (Lisbon)',
        url: 'https://onthewall.nfcsummit.com/people/k4ncun0',
      },
    },
    {
      '@type': 'Organization',
      name: 'Normies Yacht Club',
      url: 'https://normiesyachtclub.com/',
      founder: { '@id': PERSON_ID },
    },
    {
      '@type': 'Organization',
      name: '8362 Coffee',
      url: 'https://8362coffee.com/',
      founder: { '@id': PERSON_ID },
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
      description: 'Video mini-series for the JPEG Frens NFT community. Season 2 is airing on X.',
      creator: { '@id': PERSON_ID },
      about: { '@id': `${SITE}/#jpegfrens` },
      inLanguage: 'en',
      hasPart: [
        {
          '@type': 'VideoObject',
          name: 'FRENS AFTER DARK, Season 2, Ep. 2: Touch Grass Protocol',
          url: 'https://x.com/OsayKancuno/status/2120201931423420808',
          uploadDate: '2026-11-10',
          duration: 'PT1M15S',
          creator: { '@id': PERSON_ID },
        },
        {
          '@type': 'VideoObject',
          name: 'FRENS AFTER DARK, Season 2, Ep. 3: Hold The Button',
          url: 'https://x.com/OsayKancuno/status/2120563587244576871',
          uploadDate: '2026-11-11',
          duration: 'PT1M15S',
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
