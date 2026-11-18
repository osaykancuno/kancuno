import type { Metadata } from 'next'
import ImageWrap from '@/components/lab/ImageWrap'
import './wrap.css'

export const metadata: Metadata = {
  title: 'Image Wrap',
  description: 'Choose a picture and wear it on the 3D Kancuno K: print it across the figure or on every block, frame it, map it to the logo colours. Stays in your browser.',
  alternates: { canonical: '/klab/wrap' },
}

export default function WrapPage() {
  return <ImageWrap />
}
