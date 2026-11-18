// Pure K design → SVG string renderer, shared by every K.LAB tool and every export.
// Animation is a function of time (t, seconds): frame N of a loop is renderSvg(d, { t: N / fps }),
// so previews, GIF and video always match. No scripts, no CSS animation, no external refs.
import { BAR, CANVAS, CENTER, FIGURE_BOX, HEAD, HEAD_BOX, HEAD_H, HEAD_W } from './base'
import type { Fill, KDesign, PartId } from './design'
import { isHex } from './validate'

export interface RenderOpts {
  t?: number // seconds into the loop (0 = still)
  uid?: string // id prefix, unique per SVG on the same page
  size?: number // width/height in px (omit = 100%)
  selected?: PartId | null // draws a selection outline (editor only)
  interactive?: boolean // adds data-part attributes for click-to-select
}

type Box = { x: number; y: number; w: number; h: number }
const CANVAS_BOX: Box = { x: 0, y: 0, w: CANVAS, h: CANVAS }

const n = (v: number) => (Math.round(v * 100) / 100).toString()
const col = (c: string) => (isHex(c) ? c : '#000000')
const esc = (s: string) => s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[ch]!)
const TAU = Math.PI * 2

// Deterministic hash → 0..1 (glitch slices and rain must repeat exactly every loop)
const hash = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function paint(fill: Fill, id: string, box: Box, defs: string[]): string {
  if (fill.kind === 'solid') return col(fill.a)
  if (fill.kind === 'gradient') {
    const a = (fill.angle * Math.PI) / 180
    const cx = box.x + box.w / 2
    const cy = box.y + box.h / 2
    const half = (Math.abs(Math.cos(a)) * box.w + Math.abs(Math.sin(a)) * box.h) / 2
    const dx = Math.cos(a) * half
    const dy = Math.sin(a) * half
    defs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(cx - dx)}" y1="${n(cy - dy)}" x2="${n(cx + dx)}" y2="${n(cy + dy)}">` +
        `<stop offset="0" stop-color="${col(fill.a)}"/><stop offset="1" stop-color="${col(fill.b)}"/></linearGradient>`,
    )
    return `url(#${id})`
  }
  const s = fill.scale
  const a = col(fill.a)
  const b = col(fill.b)
  let body = ''
  let w = s
  let tf = ''
  switch (fill.pattern) {
    case 'stripes':
      body = `<rect width="${n(s)}" height="${n(s)}" fill="${a}"/><rect width="${n(s / 2)}" height="${n(s)}" fill="${b}"/>`
      tf = ' patternTransform="rotate(45)"'
      break
    case 'dots':
      body = `<rect width="${n(s)}" height="${n(s)}" fill="${a}"/><circle cx="${n(s / 2)}" cy="${n(s / 2)}" r="${n(s * 0.22)}" fill="${b}"/>`
      break
    case 'checker':
      w = s * 2
      body = `<rect width="${n(w)}" height="${n(w)}" fill="${a}"/><rect width="${n(s)}" height="${n(s)}" fill="${b}"/><rect x="${n(s)}" y="${n(s)}" width="${n(s)}" height="${n(s)}" fill="${b}"/>`
      break
    case 'scan':
      body = `<rect width="${n(s)}" height="${n(s)}" fill="${a}"/><rect width="${n(s)}" height="${n(s * 0.35)}" fill="${b}"/>`
      break
    case 'grid':
      body = `<rect width="${n(s)}" height="${n(s)}" fill="${a}"/><path d="M0 0H${n(s)}M0 0V${n(s)}" stroke="${b}" stroke-width="${n(Math.max(0.2, s * 0.08))}"/>`
      break
  }
  defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" x="${n(box.x)}" y="${n(box.y)}" width="${n(w)}" height="${n(w)}"${tf}>${body}</pattern>`)
  return `url(#${id})`
}

const LINE_W = 1.4

function capsule(angle: number, attrs: string, inset = 0): string {
  const L = BAR.length - inset * 2
  const T = BAR.thickness - inset * 2
  return `<rect x="${n(BAR.cx - L / 2)}" y="${n(BAR.cy - T / 2)}" width="${n(L)}" height="${n(T)}" rx="${n(T / 2)}" transform="rotate(${angle} ${BAR.cx} ${BAR.cy})" ${attrs}/>`
}

export function renderSvg(d: KDesign, o: RenderOpts = {}): string {
  const uid = (o.uid ?? 'k').replace(/[^a-zA-Z0-9_-]/g, '')
  const t = o.t ?? 0
  const defs: string[] = []
  const has = (l: KDesign['anim']['loops'][number]) => d.anim.loops.includes(l)
  const ph = d.anim.period > 0 ? ((t % d.anim.period) + d.anim.period) % d.anim.period / d.anim.period : 0
  const dp = (p: string) => (o.interactive ? ` data-part="${p}"` : '')
  const out: string[] = []

  // ── Background ────────────────────────────────────────────────
  if (d.bg.visible) out.push(`<rect width="${CANVAS}" height="${CANVAS}" fill="${paint(d.bg.fill, `${uid}-bg`, CANVAS_BOX, defs)}"${dp('bg')}/>`)
  else if (o.interactive) out.push(`<rect width="${CANVAS}" height="${CANVAS}" fill="transparent"${dp('bg')}/>`)

  // ── Pixel rain, behind the figure ─────────────────────────────
  if (has('rain')) {
    const tones = [d.head.cubes[3], d.head.cubes[5], d.form === 'pixel' ? '#fbc500' : d.head.cubes[0]].map(col)
    const drops: string[] = []
    for (let i = 0; i < 22; i++) {
      const x = Math.floor(hash(i + d.fx.seed) * 25) * 4
      const sz = 2 + Math.floor(hash(i * 7.3 + 1) * 3)
      const speed = 1 + Math.floor(hash(i * 3.1 + 2) * 2)
      const y = ((hash(i * 1.7 + 3) * 120 + ph * 120 * speed) % 120) - 10
      drops.push(`<rect x="${n(x)}" y="${n(y)}" width="${sz}" height="${sz}" fill="${tones[i % 3]}" opacity="${n(0.35 + hash(i * 5.1) * 0.5)}"/>`)
    }
    out.push(`<g>${drops.join('')}</g>`)
  }

  // ── Figure ────────────────────────────────────────────────────
  const fig: string[] = []
  if (d.form === 'pixel') {
    const size = d.grid.size
    const c = CANVAS / size
    const g = d.grid.gap * c
    const s = c - g + (g === 0 ? 0.04 : 0) // tiny overlap avoids hairline seams when gap is 0
    const cells: string[] = []
    d.grid.cells.forEach((v, i) => {
      if (!v || !isHex(v)) return
      const x = (i % size) * c + g / 2
      const y = Math.floor(i / size) * c + g / 2
      cells.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(s)}" height="${n(s)}" fill="${v}"/>`)
    })
    fig.push(`<g shape-rendering="crispEdges"${dp('pixels')}>${cells.join('')}</g>`)
  } else {
    if (d.body.visible) {
      const p = paint(d.body.fill, `${uid}-bd`, FIGURE_BOX, defs)
      const attrs = d.body.line ? `fill="none" stroke="${p}" stroke-width="${LINE_W}"` : `fill="${p}"`
      const inset = d.body.line ? LINE_W / 2 : 0
      fig.push(`<g${dp('body')}>${capsule(BAR.angle, attrs, inset)}${capsule(-BAR.angle, attrs, inset)}</g>`)
    }
    if (d.head.visible) {
      const shared = d.head.useFill ? paint(d.head.fill, `${uid}-hd`, HEAD_BOX, defs) : ''
      const cubes = HEAD.map((h, i) => {
        const p = shared || col(d.head.cubes[i])
        let y = h.y
        let hh = HEAD_H
        // gentle, so the 2-3-2 head never breaks apart
        if (has('wave')) y += Math.sin(TAU * (ph - i / 7)) * 0.9
        if (has('blink') && h.row === 2) {
          // a quick blink of the front (pink) row around the middle of the loop
          const k = Math.max(0, 1 - Math.abs(ph - 0.5) / 0.06)
          hh = HEAD_H * (1 - 0.55 * k) // the block narrows, never disappears
          y += (HEAD_H - hh) / 2
        }
        const ins = d.head.line ? LINE_W / 2 : 0
        const attrs = d.head.line ? `fill="none" stroke="${p}" stroke-width="${LINE_W}"` : `fill="${p}"`
        return `<rect x="${n(h.x + ins)}" y="${n(y + ins)}" width="${n(HEAD_W - ins * 2)}" height="${n(hh - ins * 2)}" ${attrs}/>`
      })
      fig.push(`<g${dp('head')}>${cubes.join('')}</g>`)
    }
  }

  // Motion
  let ty = 0
  let rot = 0
  if (has('bounce')) ty -= Math.sin(Math.PI * ph) * 7
  if (has('spin')) rot += Math.sin(TAU * ph) * 8 // flat view: a gentle sway (3D: a full turn)
  if (has('float')) {
    ty += Math.sin(TAU * ph) * 2.5
    rot += Math.sin(TAU * ph + Math.PI / 2) * 2
  }
  const motion = ty || rot ? ` transform="translate(0 ${n(ty)})${rot ? ` rotate(${n(rot)} ${CENTER} ${CENTER})` : ''}"` : ''

  // Glow (pulse animates it), pixelate
  let glow = d.fx.glow
  if (has('pulse')) glow = (glow || 0.6) * (0.3 + 0.7 * (0.5 - 0.5 * Math.cos(TAU * ph)))
  const pixel = d.fx.pixel
  const fxPrims: string[] = []
  let src = 'SourceGraphic'
  if (pixel > 0) {
    const B = 1 + pixel * 2.6 // at most ~3 pixels across a head block: the K keeps its shape
    const f = B * 0.3
    fxPrims.push(
      `<feFlood x="${n((B - f) / 2)}" y="${n((B - f) / 2)}" width="${n(f)}" height="${n(f)}"/>` +
        `<feComposite width="${n(B)}" height="${n(B)}"/><feTile result="${uid}t"/>` +
        `<feComposite in="SourceGraphic" in2="${uid}t" operator="in"/>` +
        `<feMorphology operator="dilate" radius="${n((B - f) / 2)}" result="${uid}p"/>`,
    )
    src = `${uid}p`
  }
  if (glow > 0.001) {
    fxPrims.push(
      `<feGaussianBlur in="${src}" stdDeviation="${n(0.4 + glow * 1.4)}" result="${uid}b1"/>` +
        `<feGaussianBlur in="${src}" stdDeviation="${n(1 + glow * 4.5)}" result="${uid}b2"/>` +
        `<feMerge><feMergeNode in="${uid}b2"/><feMergeNode in="${uid}b1"/><feMergeNode in="${src}"/></feMerge>`,
    )
  }
  const fxAttr = fxPrims.length ? ` filter="url(#${uid}-fx)"` : ''
  if (fxPrims.length) defs.push(`<filter id="${uid}-fx" filterUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120" color-interpolation-filters="sRGB">${fxPrims.join('')}</filter>`)

  // Glitch: RGB split + shifted slices (animated in steps when the glitch loop is on)
  let glitch = d.fx.glitch
  let gseed = d.fx.seed
  if (has('glitch')) {
    const step = Math.floor(ph * 12)
    gseed += step * 13
    glitch = hash(step + d.fx.seed) > 0.5 ? Math.max(glitch, 0.4) : glitch * 0.25
  }
  const figId = `${uid}-fig`
  const layers: string[] = []
  if (d.fx.depth > 0) {
    defs.push(`<filter id="${uid}-sh" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${n(0.25 + d.fx.depth * 0.3)} 0"/></filter>`)
    layers.push(`<use href="#${figId}" transform="translate(${n(d.fx.depth * 2)} ${n(d.fx.depth * 2.8)})" filter="url(#${uid}-sh)"/>`)
  }
  let splitAttr = ''
  if (glitch > 0.01) {
    const k = glitch * 1.4
    defs.push(
      `<filter id="${uid}-sp" filterUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120" color-interpolation-filters="sRGB">` +
        `<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="${uid}r"/><feOffset in="${uid}r" dx="${n(-k)}" result="${uid}ro"/>` +
        `<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" result="${uid}c"/><feOffset in="${uid}c" dx="${n(k)}" result="${uid}co"/>` +
        `<feBlend in="${uid}ro" in2="${uid}co" mode="screen"/></filter>`,
    )
    splitAttr = ` filter="url(#${uid}-sp)"`
  }
  layers.push(`<g${splitAttr}><g id="${figId}">${fig.join('')}</g></g>`)
  if (glitch > 0.01) {
    for (let i = 0; i < 4; i++) {
      const y = 20 + hash(gseed + i * 11) * 60
      const h = 1.5 + hash(gseed + i * 5) * 5
      const dx = (hash(gseed + i * 3) - 0.5) * 7 * glitch // slices shift a little: the K stays whole
      defs.push(`<clipPath id="${uid}-c${i}"><rect x="0" y="${n(y)}" width="${CANVAS}" height="${n(h)}"/></clipPath>`)
      layers.push(`<g clip-path="url(#${uid}-c${i})" pointer-events="none"><use href="#${figId}" transform="translate(${n(dx)} 0)"/></g>`)
    }
  }
  out.push(`<g${fxAttr}${motion}>${layers.join('')}</g>`)

  // ── Overlays: scan band, scanlines, grain ─────────────────────
  if (has('scan')) {
    const y = ph * 112 - 6
    out.push(`<rect x="0" y="${n(y)}" width="${CANVAS}" height="5" fill="#ffffff" opacity="0.07" pointer-events="none"/><rect x="0" y="${n(y + 4)}" width="${CANVAS}" height="0.5" fill="#ffffff" opacity="0.22" pointer-events="none"/>`)
  }
  if (d.fx.scan > 0) {
    defs.push(`<pattern id="${uid}-sl" patternUnits="userSpaceOnUse" width="2" height="1.6"><rect width="2" height="0.55" fill="#000000"/></pattern>`)
    out.push(`<rect width="${CANVAS}" height="${CANVAS}" fill="url(#${uid}-sl)" opacity="${n(d.fx.scan * 0.4)}" pointer-events="none"/>`)
  }
  if (d.fx.grain > 0) {
    defs.push(
      `<filter id="${uid}-gr" filterUnits="userSpaceOnUse" x="0" y="0" width="${CANVAS}" height="${CANVAS}"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="${d.fx.seed % 1000}"/><feColorMatrix type="saturate" values="0"/></filter>`,
    )
    out.push(`<rect width="${CANVAS}" height="${CANVAS}" filter="url(#${uid}-gr)" opacity="${n(d.fx.grain * 0.45)}" style="mix-blend-mode:overlay" pointer-events="none"/>`)
  }

  // ── Selection outline (editor only) ───────────────────────────
  if (o.selected) {
    const ring = (shape: string) => `<g fill="none" pointer-events="none">${shape.replace('/>', ' stroke="#0f0d0a" stroke-width="1.1"/>')}${shape.replace('/>', ' stroke="#fff6dc" stroke-width="0.5" stroke-dasharray="1.6 1.2"/>')}</g>`
    const rect = (b: Box, pad: number) => `<rect x="${n(b.x - pad)}" y="${n(b.y - pad)}" width="${n(b.w + pad * 2)}" height="${n(b.h + pad * 2)}"/>`
    if (o.selected === 'bg') out.push(ring(rect(CANVAS_BOX, -1.5)))
    if (o.selected === 'head') out.push(ring(rect(HEAD_BOX, 1.5)))
    if (o.selected === 'body') out.push(ring(rect({ x: 30, y: 47, w: 40, h: 32 }, 1)))
  }

  const size = o.size ? `width="${o.size}" height="${o.size}"` : 'width="100%" height="100%"'
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" ${size}>` +
    `<title>${esc(d.name)} · THE K.LAB</title>` +
    (defs.length ? `<defs>${defs.join('')}</defs>` : '') +
    out.join('') +
    `</svg>`
  )
}

export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
