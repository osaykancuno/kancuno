import type { Metadata } from 'next'
import ImageWrap from '@/components/lab/ImageWrap'
import './wrap.css'

export const metadata: Metadata = {
  title: 'Image Wrap',
  description: 'Choose a picture and put it on K1N0 in 3D: print it across the figure or on every block, frame it, map it to the original colours. Stays in your browser.',
  alternates: { canonical: '/klab/wrap' },
}

export default function WrapPage() {
  return <ImageWrap />
}
