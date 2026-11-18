import type { Metadata } from 'next'
import PixelForge from '@/components/lab/PixelForge'
import './pixel.css'

export const metadata: Metadata = {
  title: 'Pixel Forge',
  description: 'Draw the K one pixel at a time. A pixel editor for the Kancuno logo with mirror, fill, limited palette and PNG, SVG and JSON export.',
  alternates: { canonical: '/lab/pixel' },
}

export default function PixelPage() {
  return <PixelForge />
}
