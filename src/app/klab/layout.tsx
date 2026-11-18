import type { Metadata } from 'next'
import Link from 'next/link'
import { LabProvider } from '@/lib/lab/store'
import LabHeader from '@/components/lab/LabHeader'
import './lab.css'

const TITLE = 'THE K.LAB · KANCUNO'
const DESCRIPTION =
  'THE K.LAB by Osay Kancuno: one symbol, infinite variations. Free tools to create, remix and animate art in the Kancuno style, in the browser, no wallet needed.'

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
          <span className="lab-label">THE K.LAB · by K4NCUN0</span>
          <span className="lab-label">Create off-chain. Mint only if you want.</span>
          <Link className="lab-label" href="/">kancuno.com</Link>
        </footer>
      </div>
    </LabProvider>
  )
}
