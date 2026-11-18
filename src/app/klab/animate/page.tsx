import type { Metadata } from 'next'
import { AnimationBench } from '@/components/lab/AnimationBench'
import './animate.css'

export const metadata: Metadata = {
  title: 'Animation Bench',
  description: 'Make the K move. Pick loops, set the period and export a seamless GIF, video or PNG.',
  alternates: { canonical: '/klab/animate' },
}

export default function Page() {
  return <AnimationBench />
}
