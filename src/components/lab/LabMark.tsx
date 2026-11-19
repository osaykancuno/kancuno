// The mark of THE K.LAB: a K1N0 on cream with a pink centre and lime front blocks (flat, for the
// header). Not the K4NCUN0 logo: that one is K1N0 #0, the artist's own piece.
export default function LabMark({ size = 28, title }: { size?: number; title?: string }) {
  const ink = '#0f0d0a'
  const cube = (x: number, y: number, fill: string) => <rect x={x} y={y} width="6.4" height="6.4" rx="1.3" fill={fill} />
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <rect width="32" height="32" rx="6" fill="#fff6dc" />
      <path d="M0 8H32M0 16H32M0 24H32M8 0V32M16 0V32M24 0V32" stroke={ink} strokeOpacity=".12" strokeWidth=".5" />
      <path d="M9 19 L23 29.5 M23 19 L9 29.5" stroke={ink} strokeWidth="4.2" strokeLinecap="round" />
      {cube(10.2, 2.2, ink)}
      {cube(15.4, 2.2, ink)}
      {cube(6.7, 7.2, ink)}
      {cube(12.8, 7.2, '#fc98ca')}
      {cube(18.9, 7.2, ink)}
      {cube(9.6, 12.2, '#c8f04a')}
      {cube(16, 12.2, '#c8f04a')}
    </svg>
  )
}
