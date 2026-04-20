import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://kancuno.com'),
  title: 'Osay Kancuno',
  description: 'Portfolio & tools by @osaykancuno — Normie #8362 | Builder for The Normies & Khorafun communities',
  openGraph: {
    title: 'Osay Kancuno',
    description: 'Portfolio & tools by @osaykancuno',
    images: ['/8362.png'],
  },
  twitter: {
    card: 'summary',
    site: '@OsayKancuno',
    creator: '@OsayKancuno',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
