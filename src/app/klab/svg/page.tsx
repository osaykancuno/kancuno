import type { Metadata } from 'next'
import { SvgSuite } from '@/components/lab/SvgSuite'
import './svg.css'

export const metadata: Metadata = {
  title: 'SVG Suite',
  description: 'Render, clean and download SVG. Optimise K1N0 or your own file and grab the base K1N0 files.',
  alternates: { canonical: '/klab/svg' },
}

export default function Page() {
  return <SvgSuite />
}
