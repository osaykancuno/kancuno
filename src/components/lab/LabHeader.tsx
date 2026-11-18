'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoMark from '@/components/experience/LogoMark'

export const LAB_TOOLS = [
  { href: '/lab/editor', code: 'T.01', name: 'K Editor' },
  { href: '/lab/pixel', code: 'T.02', name: 'Pixel Forge' },
  { href: '/lab/animate', code: 'T.03', name: 'Animation Bench' },
  { href: '/lab/svg', code: 'T.04', name: 'SVG Suite' },
  { href: '/lab/touch', code: 'T.05', name: 'Touch Field' },
  { href: '/lab/wrap', code: 'T.06', name: 'Image Wrap' },
] as const

export default function LabHeader() {
  const path = usePathname()
  return (
    <header className="lab-head">
      <Link href="/lab" className="lab-brand" aria-label="THE K.LAB home">
        <span className="lab-brand__mark"><LogoMark size={26} /></span>
        <span className="lab-brand__name">THE K.LAB</span>
      </Link>
      <nav className="lab-nav" aria-label="K.LAB tools">
        {LAB_TOOLS.map(t => (
          <Link key={t.href} href={t.href} className="lab-nav__link" aria-current={path === t.href ? 'page' : undefined}>
            {t.name}
          </Link>
        ))}
      </nav>
      <Link href="/" className="lab-nav__home">kancuno.com <span aria-hidden="true">↗</span></Link>
    </header>
  )
}
