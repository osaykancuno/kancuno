'use client'

import { ReactNode } from 'react'
import { motion, useDragControls, AnimatePresence } from 'framer-motion'
import { useWindowManager, WindowId } from './WindowManager'

interface WindowProps {
  id: WindowId
  title: string
  children: ReactNode
  width?: number
  height?: number
}

export default function Window({ id, title, children, width = 480, height = 400 }: WindowProps) {
  const { windows, closeWindow, minimizeWindow, focusWindow, toggleMaximize, updatePosition } = useWindowManager()
  const win = windows.find(w => w.id === id)
  const dragControls = useDragControls()

  if (!win || !win.isOpen) return null

  const isMax = win.isMaximized

  const posStyle = isMax
    ? { left: 0, top: 0, x: 0, y: 0, width: '100vw', height: 'calc(100vh - 40px)' }
    : {
        left: 0, top: 0,
        x: win.position.x,
        y: win.position.y,
        width,
        maxWidth: 'calc(100vw - 20px)',
        height: height + 28,
        maxHeight: 'calc(100vh - 60px)',
      }

  return (
    <AnimatePresence>
      {!win.isMinimized && (
        <motion.div
          key={id}
          drag={!isMax}
          dragControls={dragControls}
          dragMomentum={false}
          dragListener={false}
          dragElastic={0}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.88 }}
          transition={{ duration: 0.12 }}
          style={{ position: 'fixed', zIndex: win.zIndex, ...posStyle }}
          onMouseDown={() => focusWindow(id)}
          onDragEnd={(_, info) => {
            if (!isMax) updatePosition(id, {
              x: win.position.x + info.offset.x,
              y: win.position.y + info.offset.y,
            })
          }}
          className="pixel-border bg-[#e3e5e4] flex flex-col"
        >
          {/* Title bar */}
          <div
            className="flex items-center justify-between px-2 select-none flex-shrink-0"
            style={{
              background: '#48494b',
              minHeight: 28,
              cursor: isMax ? 'default' : 'grab',
            }}
            onPointerDown={e => { if (!isMax) dragControls.start(e) }}
            onDoubleClick={() => toggleMaximize(id)}
          >
            <span
              className="text-white truncate flex-1 mr-2"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, letterSpacing: 1 }}
            >
              {title}
            </span>
            <div className="flex gap-1">
              <button className="win-btn" onClick={e => { e.stopPropagation(); minimizeWindow(id) }} title="Minimize">_</button>
              <button className="win-btn" onClick={e => { e.stopPropagation(); toggleMaximize(id) }} title={isMax ? 'Restore' : 'Maximize'}>
                {isMax ? '❐' : '□'}
              </button>
              <button className="win-btn" onClick={e => { e.stopPropagation(); closeWindow(id) }} title="Close">×</button>
            </div>
          </div>

          {/* Content */}
          <div
            className="overflow-auto flex-1"
            style={{ fontFamily: "'VT323', monospace" }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
