import type { Metadata } from 'next'
import HoldersView from '@/components/lab/HoldersView'

export const metadata: Metadata = {
  title: 'Your K1N0',
  description: 'For K1N0 holders: connect your wallet, find your pieces and change their look on-chain. An effect for each colour, the speed and the 3D view, for the gas only.',
  alternates: { canonical: '/klab/mine' },
}

export default function HoldersPage() {
  return <HoldersView />
}
