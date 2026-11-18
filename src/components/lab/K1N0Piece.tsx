'use client'
// A K1N0 exactly as its NFT shows it: the 3D piece the KLabViewer contract puts in the token
// (same page, generated from the same file), in a sandboxed frame. Drag to turn it.
import { useMemo } from 'react'
import { viewerHtml } from '@/lib/lab/k1n0-viewer'

export default function K1N0Piece({ data, label, className = 'k1-piece' }: { data: string; label: string; className?: string }) {
  const html = useMemo(() => viewerHtml(data), [data])
  return <iframe className={className} title={label} srcDoc={html} sandbox="allow-scripts" />
}
