import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import MutationIntro from '@/components/MutationIntro'
import './globals.css'

const SITE = 'https://www.kancuno.com'
const DESCRIPTION =
  'Osay Kancuno (K4NCUN0, @OsayKancuno) is the founder of NEONFACES: 5555 fully on-chain pixel faces on Robinhood Chain, ' +
  'where every Face is a wallet. Member and holder of THE100 in The Normies (Normie #8362). ' +
  'Also founder of Normies Yacht Club and 8362 Coffee.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Osay Kancuno: Founder of NEONFACES · Normies THE100',
  description: DESCRIPTION,
  applicationName: 'Osay Kancuno',
  authors: [{ name: 'Osay Kancuno', url: SITE }],
  creator: 'Osay Kancuno',
  keywords: [
    'NEONFACES', 'neonfaces.xyz', 'NEONFACES founder', 'Osay Kancuno', 'K4NCUN0', 'Kancuno',
    'The Normies', 'THE100', 'Normies THE100', 'Normie #8362', 'Robinhood Chain', 'on-chain NFT',
    'pixel art NFT', 'Normies Yacht Club', '8362 Coffee',
  ],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  openGraph: {
    type: 'profile',
    url: SITE,
    siteName: 'Osay Kancuno',
    title: 'Osay Kancuno: Founder of NEONFACES · Normies THE100',
    description: DESCRIPTION,
    images: [{ url: '/8362.png', alt: 'Normie #8362, the PFP of Osay Kancuno' }],
  },
  twitter: {
    card: 'summary',
    site: '@OsayKancuno',
    creator: '@OsayKancuno',
    title: 'Osay Kancuno: Founder of NEONFACES · Normies THE100',
    description: DESCRIPTION,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
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
      image: `${SITE}/8362.png`,
      jobTitle: 'Founder of NEONFACES',
      description: DESCRIPTION,
      worksFor: { '@id': 'https://neonfaces.xyz/#organization' },
      memberOf: {
        '@type': 'Organization',
        name: 'THE100 (The Normies)',
        description: 'THE100 group of The Normies community. Osay Kancuno is a member and holder.',
        parentOrganization: { '@type': 'Organization', name: 'The Normies', url: 'https://www.normies.art/' },
      },
      knowsAbout: ['NEONFACES', 'The Normies', 'On-chain NFT art', 'Robinhood Chain', 'Pixel art', 'Vibecoding', 'Web3 community tools'],
      sameAs: ['https://x.com/OsayKancuno', 'https://t.me/kancuno'],
    },
    {
      '@type': 'Organization',
      '@id': 'https://neonfaces.xyz/#organization',
      name: 'NEONFACES',
      url: 'https://neonfaces.xyz',
      logo: 'https://neonfaces.xyz/favicon.svg',
      slogan: "They don't blink.",
      description:
        '5555 fully on-chain pixel faces on Robinhood Chain. Every Face is a wallet that holds a small basket of Stock Tokens. Mint on OpenSea.',
      founder: { '@id': PERSON_ID },
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
      '@type': 'ProfilePage',
      '@id': `${SITE}/#profile`,
      url: SITE,
      name: 'Osay Kancuno: Founder of NEONFACES · Normies THE100',
      mainEntity: { '@id': PERSON_ID },
    },
  ],
}

// Runs before first paint: apply the saved theme (dark by default) and, unless the
// visitor prefers reduced motion, start in the Normies palette so MutationIntro can
// glitch it into neon. The timeout is a safety net if hydration never happens.
const PRE_PAINT = `(function(){var d=document.documentElement;var t=null;try{t=localStorage.getItem('theme')}catch(e){}d.setAttribute('data-theme',t==='light'?'light':'dark');if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){d.setAttribute('data-palette','normie');setTimeout(function(){d.removeAttribute('data-palette')},4000)}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      </head>
      <body>
        {children}
        <MutationIntro />
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
