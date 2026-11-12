'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { World } from '@/lib/world/engine'
import LogoMark from './LogoMark'
import SoundToggle from './SoundToggle'
import Drawer from './Drawer'
import {
  CommunityChapter, ContactChapter, HeroChapter, ProfileChapter, WorksChapter, type DrawerKey,
} from './Chapters'
import { CHAPTER_LABELS } from './content'

const N = CHAPTER_LABELS.length
const SIDES = ['hero', 'right', 'left', 'right', 'left'] as const
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))

export default function Experience() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chapterRefs = useRef<(HTMLElement | null)[]>([])
  const barRef = useRef<HTMLDivElement>(null)
  const countRef = useRef<HTMLDivElement>(null)
  const lastV = useRef<string[]>([])
  const uiRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<World | null>(null)
  const target = useRef(0)
  const current = useRef(0)
  const activeRef = useRef(0)
  const drawerRef = useRef<DrawerKey | null>(null)

  const [active, setActive] = useState(0)
  const [drawer, setDrawer] = useState<DrawerKey | null>(null)
  const [ready, setReady] = useState(false)
  const [fallback, setFallback] = useState(false)

  drawerRef.current = drawer

  // Explicit navigation (buttons, keys) moves focus to the new chapter; gestures don't
  const focusOnChange = useRef(false)
  const goTo = useCallback((i: number) => {
    target.current = clamp(Math.round(i), 0, N - 1)
    focusOnChange.current = true
  }, [])
  const step = useCallback((d: number) => {
    target.current = clamp(Math.round(target.current) + d, 0, N - 1)
    focusOnChange.current = true
  }, [])
  const openDrawer = useCallback((k: DrawerKey) => setDrawer(k), [])
  const closeDrawer = useCallback(() => setDrawer(null), [])

  // ── World + frame loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lowPower = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
    const root = rootRef.current!
    const canvas = canvasRef.current!
    let disposed = false
    let raf = 0
    let last = performance.now()
    let engineReady = false
    let shown = 0
    const loadStart = performance.now()

    let lastRendered = -1
    let lastRenderMs = 0
    let dirty = true
    const resize = () => {
      worldRef.current?.resize(root.clientWidth, root.clientHeight)
      dirty = true
    }

    import('@/lib/world/engine')
      .then(({ createWorld }) => {
        if (disposed) return
        const world = createWorld(canvas, { reducedMotion: reduced, lowPower })
        if (!world) { setFallback(true); engineReady = true; return }
        worldRef.current = world
        resize()
        return world.warmup().then(() => { engineReady = true })
      })
      .catch(() => { setFallback(true); engineReady = true })

    // Wait for the display font, but never hold the loader for a slow network
    let fontsDone = false
    Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise(r => setTimeout(r, 900)),
    ]).then(() => { fontsDone = true })

    let started = false
    const frame = (ms: number) => {
      const now = ms / 1000
      const dt = Math.min(0.1, (ms - last) / 1000) // slow devices still finish transitions on time
      last = ms

      // Loader counter: eases toward 100, holds at 90 until everything is ready
      if (!started) {
        const elapsed = (ms - loadStart) / 1000
        const cap = engineReady && fontsDone ? 100 : 90
        const goal = Math.min(cap, (elapsed / (reduced ? 0.2 : 1.1)) * 100)
        shown += (goal - shown) * (reduced ? 1 : 1 - Math.exp(-dt * 9))
        const value = Math.min(100, Math.round(shown + (cap === 100 && goal >= 100 ? 0.6 : 0)))
        if (countRef.current && countRef.current.textContent !== String(value)) countRef.current.textContent = String(value)
        if (value >= 100) {
          started = true
          worldRef.current?.startIntro(now + 0.15)
          setReady(true)
        }
      }

      // Scroll position: eased toward the target chapter
      const c = current.current
      const t = target.current
      current.current = reduced ? t : Math.abs(t - c) < 0.0005 ? t : c + (t - c) * (1 - Math.exp(-dt * 4))

      const s = current.current
      for (let i = 0; i < N; i++) {
        const el = chapterRefs.current[i]
        const v = Math.max(0, 1 - Math.abs(s - i) * 2.4).toFixed(3)
        if (el && lastV.current[i] !== v) {
          lastV.current[i] = v
          el.style.setProperty('--v', v)
        }
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${(s / (N - 1)).toFixed(4)})`
      const a = Math.round(s)
      if (a !== activeRef.current) {
        activeRef.current = a
        setActive(a)
      }

      // Idle frames: 30fps on phones; nothing at all when motion is reduced and still
      const moving = s !== lastRendered || !started || dirty
      const skip = !moving && (reduced || (lowPower && ms - lastRenderMs < 31))
      if (!skip) {
        worldRef.current?.update(s, dt, now)
        lastRendered = s
        lastRenderMs = ms
        dirty = false
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const ro = new ResizeObserver(resize)
    ro.observe(root)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      worldRef.current?.dispose()
      worldRef.current = null
    }
  }, [])

  // ── Input: wheel, touch, keys, pointer ──────────────────────────────────────
  useEffect(() => {
    const root = rootRef.current!
    let gestureBase = 0
    let lastWheel = 0
    let dir = 0
    let snapTimer = 0

    // Scrollable regions (the drawer, a chapter that overflows a short screen) keep their own scroll
    const inLocked = (t: EventTarget | null) => {
      const el = t instanceof Element ? t.closest<HTMLElement>('[data-scroll-lock]') : null
      if (!el || el.scrollHeight <= el.clientHeight + 1) return false
      const oy = getComputedStyle(el).overflowY
      return oy === 'auto' || oy === 'scroll'
    }

    const snap = () => {
      const t = target.current
      const base = Math.floor(t)
      const frac = t - base
      // Commit in the direction of travel once past a small threshold
      target.current = clamp(dir > 0 ? (frac > 0.16 ? base + 1 : base) : (frac < 0.84 ? base : base + 1), 0, N - 1)
    }

    const onWheel = (e: WheelEvent) => {
      if (drawerRef.current || e.ctrlKey || inLocked(e.target)) return
      let d = e.deltaY
      if (e.deltaMode === 1) d *= 32
      else if (e.deltaMode === 2) d *= window.innerHeight
      if (Math.abs(d) < 0.5) return
      const now = performance.now()
      if (now - lastWheel > 260) gestureBase = Math.round(target.current)
      lastWheel = now
      dir = Math.sign(d)
      focusOnChange.current = false
      target.current = clamp(target.current + d * 0.0011, Math.max(0, gestureBase - 1), Math.min(N - 1, gestureBase + 1))
      window.clearTimeout(snapTimer)
      snapTimer = window.setTimeout(snap, 140)
    }

    let y0 = 0, t0 = 0, touchBase = 0, tracking = false
    const onTouchStart = (e: TouchEvent) => {
      if (drawerRef.current || inLocked(e.target) || e.touches.length !== 1) { tracking = false; return }
      tracking = true
      y0 = e.touches[0].clientY
      t0 = performance.now()
      touchBase = Math.round(target.current)
      focusOnChange.current = false
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return
      const dy = y0 - e.touches[0].clientY
      target.current = clamp(touchBase + dy / (window.innerHeight * 0.6), Math.max(0, touchBase - 1), Math.min(N - 1, touchBase + 1))
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const dy = y0 - (e.changedTouches[0]?.clientY ?? y0)
      const v = dy / Math.max(1, performance.now() - t0)
      const step = Math.abs(dy) > 50 || (Math.abs(dy) > 14 && Math.abs(v) > 0.45) ? Math.sign(dy) : 0
      target.current = clamp(touchBase + step, 0, N - 1)
    }
    const onTouchCancel = () => {
      if (!tracking) return
      tracking = false
      target.current = clamp(Math.round(target.current), 0, N - 1)
    }

    const onKey = (e: KeyboardEvent) => {
      if (drawerRef.current || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      // Space activates focused controls; leave it (and Shift+Space) alone there
      const onControl = !!el && el.closest('a[href], button, select, summary, [role="button"]') !== null
      const a = Math.round(target.current)
      const next = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey && !onControl)
      const prev = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey && !onControl)
      const go = (i: number) => { e.preventDefault(); target.current = clamp(i, 0, N - 1); focusOnChange.current = true }
      if (next) go(a + 1)
      else if (prev) go(a - 1)
      else if (e.key === 'Home' && !onControl) go(0)
      else if (e.key === 'End' && !onControl) go(N - 1)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = root.getBoundingClientRect()
      worldRef.current?.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1, !drawerRef.current)
    }
    const onPointerLeave = () => worldRef.current?.setPointer(0, 0, false)

    root.addEventListener('wheel', onWheel, { passive: true })
    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: true })
    root.addEventListener('touchend', onTouchEnd, { passive: true })
    root.addEventListener('touchcancel', onTouchCancel, { passive: true })
    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(snapTimer)
      root.removeEventListener('wheel', onWheel)
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
      root.removeEventListener('touchend', onTouchEnd)
      root.removeEventListener('touchcancel', onTouchCancel)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // Only the visible chapter is interactive and exposed to assistive tech
  useEffect(() => {
    chapterRefs.current.forEach((el, i) => {
      if (!el) return
      const on = i === active
      el.toggleAttribute('inert', !on)
      el.setAttribute('aria-hidden', String(!on))
      if (on) el.setAttribute('data-active', '')
      else el.removeAttribute('data-active')
    })
    // Keyboard and button users land on the new chapter's heading
    const focused = document.activeElement
    const lost = !focused || focused === document.body || focused.closest('[inert]') !== null
    if (focusOnChange.current || lost) {
      focusOnChange.current = false
      if (lost || focused?.closest('.k-bar, .k-nav, .k-header')) {
        chapterRefs.current[active]?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
      }
    }
  }, [active])

  // While loading, or while the drawer is open, the rest of the page is out of reach
  useEffect(() => { uiRef.current?.toggleAttribute('inert', drawer !== null || !ready) }, [drawer, ready])

  const skipToContent = (e: React.MouseEvent) => {
    e.preventDefault()
    chapterRefs.current[activeRef.current]?.querySelector<HTMLElement>('h2')?.focus()
  }

  const setChapterRef = (i: number) => (el: HTMLElement | null) => { chapterRefs.current[i] = el }

  return (
    <div
      ref={rootRef}
      className="k-stage"
      data-ready={ready ? '' : undefined}
      data-chapter={active}
    >
      <canvas ref={canvasRef} className="k-canvas" aria-hidden="true" />

      {fallback && (
        <div className="k-fallback" aria-hidden="true">
          <Image src="/kancuno-logo.png" alt="" width={400} height={400} priority />
        </div>
      )}

      <div className="k-vignette" aria-hidden="true" />
      <div className="k-legibility k-legibility--left" aria-hidden="true" />
      <div className="k-legibility k-legibility--right" aria-hidden="true" />

      <div ref={uiRef} className="k-ui">
        <a href="#content" className="k-skip" onClick={skipToContent}>Skip to content</a>
        <header className="k-header">
          <button type="button" className="k-brand" onClick={() => goTo(0)} aria-label="Osay Kancuno, back to start">
            <LogoMark size={30} />
            <span>Osay Kancuno</span>
          </button>
          <div className="k-header-right">
            <SoundToggle />
            <button type="button" className="k-pill" onClick={() => goTo(N - 1)}>Let&apos;s talk</button>
          </div>
        </header>

        <nav className="k-nav" aria-label="Sections">
          {CHAPTER_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => goTo(i)}
              aria-current={active === i ? 'step' : undefined}
              aria-label={`${String(i + 1).padStart(2, '0')} ${label}`}
            >
              <span className="k-nav-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="k-nav-label">{label}</span>
            </button>
          ))}
        </nav>

        <main id="content">
          {[
            <HeroChapter key="hero" />,
            <ProfileChapter key="profile" onOpen={openDrawer} />,
            <WorksChapter key="works" onOpen={openDrawer} />,
            <CommunityChapter key="community" onOpen={openDrawer} />,
            <ContactChapter key="contact" />,
          ].map((node, i) => (
            <section
              key={i}
              ref={setChapterRef(i)}
              className={`k-ch k-ch--${SIDES[i]}`}
              aria-label={CHAPTER_LABELS[i]}
              style={{ ['--v' as string]: i === 0 ? 1 : 0 }}
              data-scroll-lock
              // Inactive chapters start inert on the server too (React 18 has no inert prop)
              {...(i !== 0 ? ({ inert: '', 'aria-hidden': true } as object) : {})}
            >
              {node}
            </section>
          ))}
        </main>

        <footer className="k-bar">
          <p className="sr-only" role="status" aria-atomic="true">
            Section {active + 1} of {N}: {CHAPTER_LABELS[active]}
          </p>
          <p className="k-bar-count" aria-hidden="true">
            <span>{String(active + 1).padStart(2, '0')}</span>
            <span className="k-bar-sep">/</span>
            <span>{String(N).padStart(2, '0')}</span>
            <span className="k-bar-label">{CHAPTER_LABELS[active]}</span>
          </p>
          <div className="k-bar-track" aria-hidden="true"><div ref={barRef} className="k-bar-fill" /></div>
          <span className="k-hint" aria-hidden="true"><span className="k-hint-line" />Scroll to explore</span>
          <div className="k-bar-arrows">
            <button type="button" onClick={() => step(-1)} aria-disabled={active === 0} aria-label="Previous section">↑</button>
            <button type="button" onClick={() => step(1)} aria-disabled={active === N - 1} aria-label="Next section">↓</button>
          </div>
        </footer>
      </div>

      <Drawer open={drawer} onClose={closeDrawer} />

      <div className="k-loader" data-done={ready ? '' : undefined} aria-hidden="true">
        <LogoMark size={44} />
        <div ref={countRef} className="k-loader-count">0</div>
        <div className="k-loader-label">K4NCUN0 — Building the world</div>
      </div>

      <div className="k-grain" aria-hidden="true" />
    </div>
  )
}
