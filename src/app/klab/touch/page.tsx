import type { Metadata } from 'next'
import TouchField from '@/components/lab/TouchField'
import './touch.css'

export const metadata: Metadata = {
  title: 'Touch Field',
  description: 'Move your pointer over K1N0 in 3D and the blocks make way. Push, lift, pull or ripple. Record a clip.',
  alternates: { canonical: '/klab/touch' },
}

export default function TouchPage() {
  return <TouchField />
}
