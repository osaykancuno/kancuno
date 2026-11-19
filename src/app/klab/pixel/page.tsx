import type { Metadata } from 'next'
import PixelForge from '@/components/lab/PixelForge'
import './pixel.css'

export const metadata: Metadata = {
  title: 'Pixel Forge',
  description: 'Draw K1N0 one pixel at a time. A pixel editor with mirror, fill, limited palette and PNG, SVG and JSON export.',
  alternates: { canonical: '/klab/pixel' },
}

export default function PixelPage() {
  return <PixelForge />
}
