import type { Metadata } from 'next'
import { Suspense } from 'react'
import TokenView from '@/components/lab/TokenView'

export const metadata: Metadata = {
  title: 'K1N0',
  description: 'A K1N0 from THE K.LAB with its own colour combination, fully on-chain on Ethereum. See it in 3D, change its look if you hold it, remix it.',
  alternates: { canonical: '/klab/token' },
}

export default function TokenPage() {
  return (
    <Suspense fallback={<div className="lab-tool"><p className="lab-note">Loading…</p></div>}>
      <TokenView />
    </Suspense>
  )
}
