import type { Metadata } from 'next'
import { Suspense } from 'react'
import TokenView from '@/components/lab/TokenView'

export const metadata: Metadata = {
  title: 'K1N0',
  description: 'A K1N0 from THE K.LAB: a Kancuno K with its own colour combination, fully on-chain on Ethereum. See it in 3D and remix it.',
  alternates: { canonical: '/lab/token' },
}

export default function TokenPage() {
  return (
    <Suspense fallback={<div className="lab-tool"><p className="lab-note">Loading…</p></div>}>
      <TokenView />
    </Suspense>
  )
}
