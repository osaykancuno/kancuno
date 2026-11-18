'use client'
// "Opening soon" next to the mint, until the contract's mint is open (read live from Ethereum).
import { useEffect, useState } from 'react'
import { KLAB, readMintState } from '@/lib/lab/chain'

export function MintSoon() {
  const [open, setOpen] = useState<boolean | null>(null)
  useEffect(() => {
    if (!KLAB.live) return
    let alive = true
    readMintState().then(s => { if (alive) setOpen(s.open) }, () => undefined)
    return () => { alive = false }
  }, [])
  if (KLAB.live && open !== false) return null // open, or not known yet: say nothing
  return <span className="lab-soon">Opening soon</span>
}
