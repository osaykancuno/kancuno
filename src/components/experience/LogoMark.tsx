// Flat version of the K4NCUN0 mark (head cubes over the X), for the header and loader.
export default function LogoMark({ size = 28, title }: { size?: number; title?: string }) {
  const ink = 'var(--k-ink)'
  const cube = (x: number, y: number, fill: string) => (
    <rect x={x} y={y} width="6.4" height="6.4" rx="1.3" fill={fill} />
  )
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M7.5 17.5 L24.5 30 M24.5 17.5 L7.5 30" stroke={ink} strokeWidth="4.6" strokeLinecap="round" />
      {cube(9.3, 0.8, ink)}
      {cube(16.3, 0.8, ink)}
      {cube(5.8, 6.4, ink)}
      {cube(12.8, 6.4, 'var(--k-purple)')}
      {cube(19.8, 6.4, ink)}
      {cube(9.3, 12, 'var(--k-pink)')}
      {cube(16.3, 12, 'var(--k-pink)')}
    </svg>
  )
}
