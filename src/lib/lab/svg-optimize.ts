// Pure, string-based SVG optimiser. No DOM. Never rewrites <style>/<script>/CDATA content or attribute strings it should not touch.

export interface OptimizeOptions {
  stripMeta: boolean // comments, <metadata>, <title>, <desc>
  collapse: boolean // whitespace between tags and inside tags
  round: boolean
  decimals: number // 0..3
  emptyGroups: boolean // empty <defs> and <g>
  editorAttrs: boolean // data-part, inkscape:/sodipodi: attributes
}

export const DEFAULT_OPTIMIZE: OptimizeOptions = {
  stripMeta: true, collapse: true, round: true, decimals: 2, emptyGroups: true, editorAttrs: true,
}

export const MAX_OPTIMIZE_BYTES = 200 * 1024

export const byteSize = (s: string) => new TextEncoder().encode(s).length

// Split into protected chunks (style, script, CDATA) and normal markup
function splitProtected(svg: string): { text: string; keep: boolean }[] {
  const re = /<!\[CDATA\[[\s\S]*?\]\]>|<style\b[\s\S]*?<\/style>|<script\b[\s\S]*?<\/script>/gi
  const out: { text: string; keep: boolean }[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(svg))) {
    if (m.index > last) out.push({ text: svg.slice(last, m.index), keep: false })
    out.push({ text: m[0], keep: true })
    last = m.index + m[0].length
  }
  if (last < svg.length) out.push({ text: svg.slice(last), keep: false })
  return out
}

function roundNum(s: string, dec: number): string {
  const v = Number(s)
  if (!Number.isFinite(v)) return s
  let r = (Math.round(v * 10 ** dec) / 10 ** dec).toString()
  if (r === '-0') r = '0'
  if (r.includes('e')) return s
  return r.replace(/^(-?)0\./, '$1.') // 0.5 -> .5 is valid in SVG numbers
}

// Round numbers inside a numeric attribute value (path data, points, transforms, plain numbers)
function roundValue(v: string, dec: number): string {
  return v.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, m => (/[eE]/.test(m) ? m : roundNum(m, dec)))
}

const ROUND_ATTRS = new Set([
  'd', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height',
  'transform', 'viewBox', 'stroke-width', 'offset', 'stdDeviation', 'dx', 'dy', 'patternTransform',
  'opacity', 'fill-opacity', 'stroke-opacity', 'stop-opacity', 'gradientTransform',
])

const ATTR = /([^\s=<>"'\/]+)\s*=\s*("[^"]*"|'[^']*')/g

function processTag(tag: string, o: OptimizeOptions): string {
  if (tag.startsWith('<?') || tag.startsWith('<!')) return tag
  let t = tag.replace(ATTR, (all, name: string, quoted: string) => {
    const q = quoted[0]
    let val = quoted.slice(1, -1)
    if (o.editorAttrs && (name === 'data-part' || /^(inkscape|sodipodi):/.test(name))) return ''
    if (o.editorAttrs && /^xmlns:(inkscape|sodipodi)$/.test(name)) return ''
    if (o.round && ROUND_ATTRS.has(name)) {
      // 0..1 valued attributes lose meaning below 2 decimals
      const fine = name === 'offset' || name === 'stdDeviation' || /opacity$/.test(name)
      val = roundValue(val, fine ? Math.max(o.decimals, 2) : o.decimals)
    }
    return `${name}=${q}${val}${q}`
  })
  if (o.collapse) {
    // collapse whitespace between attributes only (never inside quoted values)
    const parts: string[] = []
    const re = /"[^"]*"|'[^']*'|[^"']+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(t))) parts.push(/^["']/.test(m[0]) ? m[0] : m[0].replace(/\s+/g, ' '))
    t = parts.join('').replace(/\s+(\/?>)$/, '$1').replace(/\s*\/>$/, '/>')
  } else {
    t = t.replace(/\s+(\/?>)$/, '$1')
  }
  return t
}

function processMarkup(chunk: string, o: OptimizeOptions): string {
  let s = chunk
  if (o.stripMeta) {
    s = s.replace(/<!--[\s\S]*?-->/g, '')
    s = s.replace(/<metadata\b[\s\S]*?<\/metadata>/gi, '')
    s = s.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    s = s.replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/gi, '')
  }
  // tags: quoted values may contain '>' so match them explicitly
  s = s.replace(/<[a-zA-Z?!][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/g, tag => processTag(tag, o))
  if (o.collapse) s = s.replace(/>\s+</g, '><')
  return s
}

export function optimizeSvg(svg: string, o: OptimizeOptions = DEFAULT_OPTIMIZE): string {
  const chunks = splitProtected(svg)
  let out = chunks.map(c => (c.keep ? c.text : processMarkup(c.text, o))).join('')
  if (o.emptyGroups) {
    // repeat: removing a nested empty group can empty its parent
    for (let i = 0; i < 6; i++) {
      const before = out
      out = out.replace(/<(defs|g)\b[^>]*?\/>/gi, '')
      out = out.replace(/<(defs|g)\b[^>]*>\s*<\/\1>/gi, '')
      if (out === before) break
    }
  }
  if (o.collapse) out = out.trim()
  return out
}

// Set width/height on the root <svg>. size 0 = viewBox only (attributes removed). Adds a viewBox when missing.
export function setSvgSize(svg: string, size: number): string {
  return svg.replace(/<svg\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/i, (_all, attrs: string) => {
    const get = (n: string) => new RegExp(`\\s${n}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(attrs)
    const w = get('width')
    const h = get('height')
    let a = attrs.replace(/\s(width|height)\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
    if (!/\sviewBox\s*=/i.test(a)) {
      const wn = parseFloat((w?.[1] ?? w?.[2]) || '')
      const hn = parseFloat((h?.[1] ?? h?.[2]) || '')
      if (wn > 0 && hn > 0) a += ` viewBox="0 0 ${wn} ${hn}"`
    }
    const sized = size > 0 ? ` width="${size}" height="${size}"` : ''
    return `<svg${a}${sized}>`
  })
}

export const looksLikeSvg = (s: string) => /<svg\b[\s\S]*<\/svg\s*>/i.test(s)
