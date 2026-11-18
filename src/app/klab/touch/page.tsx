import type { Metadata } from 'next'
import TouchField from '@/components/lab/TouchField'
import './touch.css'

export const metadata: Metadata = {
  title: 'Touch Field',
  description: 'Move your pointer over the 3D Kancuno K and the blocks make way, like on the kancuno.com home page. Push, lift, pull or ripple. Record a clip.',
  alternates: { canonical: '/klab/touch' },
}

export default function TouchPage() {
  return <TouchField />
}
