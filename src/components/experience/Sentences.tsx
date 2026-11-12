import { Fragment } from 'react'

// Puts each sentence on its own line (a break after every full stop), so short
// paragraphs read as a list of clear statements instead of a wrapped block.
export default function Sentences({ text }: { text: string }) {
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/)
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {p}
        </Fragment>
      ))}
    </>
  )
}
