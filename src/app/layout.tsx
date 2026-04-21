import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
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
      {/* Set dark theme before first paint to avoid flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(t!=='light'){document.documentElement.setAttribute('data-theme','dark');}})()` }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
