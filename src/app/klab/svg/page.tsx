import type { Metadata } from 'next'
import { SvgSuite } from '@/components/lab/SvgSuite'
import './svg.css'

export const metadata: Metadata = {
  title: 'SVG Suite',
  description: 'Render, clean and download SVG. Optimise the K or your own file and grab the base K files.',
  alternates: { canonical: '/klab/svg' },
}

export default function Page() {
  return <SvgSuite />
}
