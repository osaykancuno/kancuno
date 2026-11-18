import type { Metadata } from 'next'
import KEditor from '@/components/lab/KEditor'

export const metadata: Metadata = {
  title: 'K Editor',
  description: 'Remix the Kancuno K: colours, gradients, patterns, neon, glitch and pixel effects. Undo, redo, export PNG, SVG and JSON. Free, in the browser.',
  alternates: { canonical: '/lab/editor' },
}

export default function EditorPage() {
  return <KEditor />
}
