'use client'
// Small, accessible form controls shared by THE K.LAB tools.
import { useId, type ReactNode } from 'react'
import { SWATCHES } from '@/lib/lab/base'
import type { Fill, PatternKind } from '@/lib/lab/design'

export function Seg<T extends string>({
  label, value, options, onChange,
}: {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="lab-row">
      <span className="lab-label">{label}</span>
      <div className="lab-seg" role="group" aria-label={label}>
        {options.map(o => (
          <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Range({
  label, value, min, max, step = 0.01, onChange, format,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  const id = useId()
  return (
    <div className="lab-range">
      <label className="lab-label" htmlFor={id}>{label}</label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={format ? format(value) : `${Math.round(value * 100)}%`} onChange={e => onChange(Number(e.target.value))} />
      <output htmlFor={id} aria-hidden="true">{format ? format(value) : Math.round(value * 100)}</output>
    </div>
  )
}

export function ColorPick({
  label, value, onChange, swatches = SWATCHES,
}: {
  label: string
  value: string
  onChange: (c: string) => void
  swatches?: readonly string[]
}) {
  const id = useId()
  return (
    <div className="lab-colorpick" role="group" aria-label={label}>
      <div className="lab-row">
        <span className="lab-label">{label}</span>
        <label className="lab-color" htmlFor={id}>
          <input id={id} type="color" value={value} onChange={e => onChange(e.target.value)} aria-label={`${label}: custom colour`} />
          {value.toUpperCase()}
        </label>
      </div>
      <div className="lab-swatches" style={{ marginTop: 8 }}>
        {swatches.map(c => (
          <button
            key={c}
            type="button"
            className="lab-swatch"
            style={{ background: c }}
            aria-pressed={value.toLowerCase() === c.toLowerCase()}
            aria-label={`${label}: ${c}`}
            title={c}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  )
}

const PATTERNS: { value: PatternKind; label: string }[] = [
  { value: 'stripes', label: 'Stripes' },
  { value: 'dots', label: 'Dots' },
  { value: 'checker', label: 'Checker' },
  { value: 'scan', label: 'Scan' },
  { value: 'grid', label: 'Grid' },
]

// Solid / gradient / pattern editor. `k` prefixes coalesce keys so slider drags are one undo step.
export function FillEditor({ fill, onChange, k, allowPattern = true }: { fill: Fill; onChange: (f: Fill, key?: string) => void; k: string; allowPattern?: boolean }) {
  const a = fill.a
  const b = fill.kind === 'solid' ? '#0f0d0a' : fill.b
  const kinds = [
    { value: 'solid', label: 'Solid' },
    { value: 'gradient', label: 'Gradient' },
    ...(allowPattern ? [{ value: 'pattern', label: 'Pattern' }] : []),
  ] as const
  return (
    <>
      <Seg
        label="Fill"
        value={fill.kind}
        options={kinds as readonly { value: Fill['kind']; label: string }[]}
        onChange={kind => {
          if (kind === 'solid') onChange({ kind, a })
          if (kind === 'gradient') onChange({ kind, a, b: b === a ? '#fc98ca' : b, angle: 90 })
          if (kind === 'pattern') onChange({ kind, a, b: b === a ? '#0f0d0a' : b, pattern: 'stripes', scale: 4 })
        }}
      />
      <ColorPick label={fill.kind === 'solid' ? 'Colour' : 'Colour A'} value={a} onChange={c => onChange({ ...fill, a: c } as Fill, `${k}-a`)} />
      {fill.kind !== 'solid' && <ColorPick label="Colour B" value={b} onChange={c => onChange({ ...fill, b: c } as Fill, `${k}-b`)} />}
      {fill.kind === 'gradient' && (
        <Range label="Angle" min={0} max={360} step={5} value={fill.angle} format={v => `${v}°`} onChange={angle => onChange({ ...fill, angle }, `${k}-angle`)} />
      )}
      {fill.kind === 'pattern' && (
        <>
          <Seg label="Pattern" value={fill.pattern} options={PATTERNS} onChange={pattern => onChange({ ...fill, pattern })} />
          <Range label="Scale" min={1.5} max={14} step={0.5} value={fill.scale} format={v => v.toFixed(1)} onChange={scale => onChange({ ...fill, scale }, `${k}-scale`)} />
        </>
      )}
    </>
  )
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  const id = useId()
  return (
    <section className="lab-panel lab-section" aria-labelledby={id}>
      {/* the heading names the section; side controls sit next to it, never inside it */}
      <div className="lab-section__title"><h2 id={id}>{title}</h2>{aside}</div>
      {children}
    </section>
  )
}
