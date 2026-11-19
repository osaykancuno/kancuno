import type { Metadata } from 'next'
import Link from 'next/link'
import { LabProvider } from '@/lib/lab/store'
import LabHeader from '@/components/lab/LabHeader'
import { Zt } from '@/components/lab/Zt'
import { COLLECTION_URL } from '@/lib/lab/chain'
import './lab.css'

const TITLE = 'THE K.LAB · KANCUNO'
const DESCRIPTION =
  'K1N0 is an open character with no owner, public domain under CC0. One symbol, infinite variations: create, remix and animate your own K1N0 in the browser, no wallet needed.'

export const metadata: Metadata = {
  title: { default: TITLE, template: '%s · THE K.LAB' },
  description: DESCRIPTION,
  alternates: { canonical: '/klab' },
  openGraph: { type: 'website', url: '/klab', title: TITLE, description: DESCRIPTION, images: [{ url: '/klab/og-lab.png', width: 1200, height: 630, alt: 'THE K.LAB: one symbol, infinite variations' }] },
  twitter: { card: 'summary_large_image', site: '@OsayKancuno', creator: '@OsayKancuno', title: TITLE, description: DESCRIPTION, images: [{ url: '/klab/og-lab.png', alt: 'THE K.LAB: one symbol, infinite variations' }] },
}

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <LabProvider>
      <div className="lab">
        <a className="lab-skip" href="#lab-main">Skip to content</a>
        <LabHeader />
        <main id="lab-main" className="lab-main">{children}</main>
        <footer className="lab-foot">
          <span className="lab-label"><Zt>THE K.LAB · started by K4NCUN0 · K1N0 is CC0</Zt></span>
          <span className="lab-label">Create off-chain. Mint only if you want.</span>
          <span className="lab-foot__links">
            <a className="lab-label" href={COLLECTION_URL} target="_blank" rel="noopener noreferrer">OpenSea ↗<span className="lab-sr"> (the K1N0 collection, opens in a new tab)</span></a>
            <Link className="lab-label" href="/">kancuno.com</Link>
          </span>
        </footer>
      </div>
    </LabProvider>
  )
}
