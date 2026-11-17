// Interface sounds, synthesised with Web Audio (no files to download).
// Themed on the 3D world: soft clay blocks, pixels landing, a pentatonic note
// per chapter. On by default and independent from the radio (SoundToggle).
// Browsers only allow audio after a user gesture: until unlockSfx() runs from a
// click, tap or key press, every sound is a silent no-op.

const VOLUME = 0.22
// C major pentatonic, one note per chapter (C4 D4 E4 G4 A4, then up an octave)
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]
const SPARKLE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51]

let ctx: AudioContext | null = null
let out: GainNode | null = null
let noise: AudioBuffer | null = null
let lastSection = 0

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }

/** Create or resume the audio context. Call only from a user gesture. */
export function unlockSfx() {
  if (typeof window === 'undefined') return
  if (!ctx) {
    const AC = window.AudioContext || (window as WebkitWindow).webkitAudioContext
    if (!AC) return
    try {
      ctx = new AC()
    } catch {
      return
    }
    // Master volume, then a gentle compressor so stacked sounds never clip
    out = ctx.createGain()
    out.gain.value = VOLUME
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 4
    out.connect(comp).connect(ctx.destination)
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
}

const live = () => (ctx && out && ctx.state === 'running' ? ctx : null)
const jitter = (x: number, amount: number) => x * (1 + (Math.random() * 2 - 1) * amount)

// A tone with a quick attack and an exponential tail
function tone(c: AudioContext, at: number, freq: number, opts: {
  type?: OscillatorType; gain?: number; attack?: number; decay?: number; drop?: number
} = {}) {
  const { type = 'sine', gain = 0.3, attack = 0.004, decay = 0.25, drop = 1 } = opts
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, at)
  if (drop !== 1) o.frequency.exponentialRampToValueAtTime(freq * drop, at + Math.min(decay, 0.12))
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
  o.connect(g).connect(out!)
  o.start(at)
  o.stop(at + attack + decay + 0.05)
}

// Filtered noise: a click, a breath of air or a slide, depending on the sweep
function air(c: AudioContext, at: number, opts: {
  from: number; to: number; dur: number; gain: number; q?: number; attack?: number
}) {
  const { from, to, dur, gain, q = 0.9, attack = dur * 0.35 } = opts
  const src = c.createBufferSource()
  src.buffer = noise
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = q
  f.frequency.setValueAtTime(from, at)
  f.frequency.exponentialRampToValueAtTime(to, at + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(f).connect(g).connect(out!)
  src.start(at, Math.random() * 0.5)
  src.stop(at + dur + 0.05)
}

/** Click: a soft clay block tapped on the table. */
export function sfxTap() {
  const c = live()
  if (!c) return
  const t = c.currentTime
  tone(c, t, jitter(560, 0.04), { type: 'triangle', gain: 0.32, attack: 0.002, decay: 0.1, drop: 0.5 })
  air(c, t, { from: 3200, to: 2400, dur: 0.03, gain: 0.12, q: 1.4, attack: 0.002 })
}

/** Chapter change: a breath of air in the direction of travel, then the blocks land on the chapter's note. */
export function sfxSection(index: number, dir: number) {
  const c = live()
  if (!c) return
  const now = performance.now()
  if (now - lastSection < 180) return // fast keyboard jumps: one sound, not a burst
  lastSection = now
  const t = c.currentTime
  air(c, t, { from: dir > 0 ? 260 : 1500, to: dir > 0 ? 1500 : 260, dur: 0.55, gain: 0.11, q: 0.7 })
  const note = SCALE[index % SCALE.length]
  const land = t + 0.42
  tone(c, land, note, { gain: 0.16, attack: 0.012, decay: 1.2 })
  tone(c, land + 0.02, note * 1.5, { gain: 0.06, attack: 0.02, decay: 0.9 })
  for (let i = 0; i < 4; i++) {
    tone(c, land + 0.05 + i * 0.07 + Math.random() * 0.03, jitter(note * 4, 0.03), { type: 'triangle', gain: 0.05, attack: 0.002, decay: 0.06, drop: 0.7 })
  }
}

/** Community tab: a cascade of pixel ticks following the wave of blocks hopping into the new shape. */
export function sfxMorph() {
  const c = live()
  if (!c) return
  const t = c.currentTime
  for (let i = 0; i < 9; i++) {
    const f = SPARKLE[Math.floor(Math.random() * SPARKLE.length)]
    tone(c, t + i * 0.085 + Math.random() * 0.03, f, { type: 'triangle', gain: 0.08 + Math.random() * 0.05, attack: 0.002, decay: 0.09 })
  }
  tone(c, t + 0.85, 130.81, { gain: 0.14, attack: 0.01, decay: 0.35, drop: 0.8 }) // the field settles
}

/** Drawer: a slide that rises when it opens and falls when it closes. */
export function sfxDrawer(open: boolean) {
  const c = live()
  if (!c) return
  const t = c.currentTime
  air(c, t, { from: open ? 500 : 2200, to: open ? 2200 : 500, dur: 0.3, gain: 0.07, q: 1.1 })
  tone(c, t + 0.05, open ? 392.0 : 293.66, { gain: 0.07, attack: 0.01, decay: 0.35 })
}
