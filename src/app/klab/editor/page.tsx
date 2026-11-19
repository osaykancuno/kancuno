import type { Metadata } from 'next'
import KEditor from '@/components/lab/KEditor'

export const metadata: Metadata = {
  title: 'K Editor',
  description: 'Remix K1N0, the open symbol of THE K.LAB: colours, gradients, patterns, neon, glitch and pixel effects. Undo, redo, export PNG, SVG and JSON, in the browser.',
  alternates: { canonical: '/klab/editor' },
}

export default function EditorPage() {
  return <KEditor />
}
