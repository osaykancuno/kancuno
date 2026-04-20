'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type WindowId = 'about' | 'works' | 'normies' | 'khorafun' | 'contact'

export interface WindowState {
  id: WindowId
  title: string
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  position: { x: number; y: number }
}

interface WindowManagerCtx {
  windows: WindowState[]
  openWindow: (id: WindowId) => void
  closeWindow: (id: WindowId) => void
  minimizeWindow: (id: WindowId) => void
  restoreWindow: (id: WindowId) => void
  focusWindow: (id: WindowId) => void
  toggleMaximize: (id: WindowId) => void
  updatePosition: (id: WindowId, pos: { x: number; y: number }) => void
}

const INITIAL_WINDOWS: WindowState[] = [
  { id: 'about',    title: 'PROFILE.EXE',  isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, position: { x: 80,  y: 60  } },
  { id: 'works',    title: 'WORKS.EXE',    isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, position: { x: 130, y: 90  } },
  { id: 'normies',  title: 'NORMIES.EXE',  isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, position: { x: 180, y: 80  } },
  { id: 'khorafun', title: 'KHORAFUN.EXE', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, position: { x: 160, y: 100 } },
  { id: 'contact',  title: 'CONTACT.EXE',  isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, position: { x: 200, y: 120 } },
]

const WindowManagerContext = createContext<WindowManagerCtx | null>(null)

let topZ = 20

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>(INITIAL_WINDOWS)

  // ── Static windows ──────────────────────────────────────────────────────────
  const openWindow = useCallback((id: WindowId) => {
    topZ++
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: topZ } : w
    ))
  }, [])

  const closeWindow = useCallback((id: WindowId) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isOpen: false, isMinimized: false, isMaximized: false } : w
    ))
  }, [])

  const minimizeWindow = useCallback((id: WindowId) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMinimized: true } : w
    ))
  }, [])

  const restoreWindow = useCallback((id: WindowId) => {
    topZ++
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMinimized: false, zIndex: topZ } : w
    ))
  }, [])

  const focusWindow = useCallback((id: WindowId) => {
    topZ++
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, zIndex: topZ } : w
    ))
  }, [])

  const toggleMaximize = useCallback((id: WindowId) => {
    topZ++
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMaximized: !w.isMaximized, isMinimized: false, zIndex: topZ } : w
    ))
  }, [])

  const updatePosition = useCallback((id: WindowId, pos: { x: number; y: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, position: pos } : w
    ))
  }, [])

  return (
    <WindowManagerContext.Provider value={{
      windows, openWindow, closeWindow, minimizeWindow, restoreWindow, focusWindow, toggleMaximize, updatePosition,
    }}>
      {children}
    </WindowManagerContext.Provider>
  )
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext)
  if (!ctx) throw new Error('useWindowManager must be used within WindowManagerProvider')
  return ctx
}
