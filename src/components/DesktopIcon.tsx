'use client'

import { useState, ComponentType } from 'react'
import { useWindowManager, WindowId } from './WindowManager'

interface DesktopIconProps {
  id: WindowId | 'twitter' | 'line' | 'coffee' | 'neonfaces'
  label: string
  Icon: ComponentType<{ size?: number }>
  href?: string
}

export default function DesktopIcon({ id, label, Icon, href }: DesktopIconProps) {
  const { openWindow } = useWindowManager()
  const [selected, setSelected] = useState(false)
  // Image-style icons fill the whole tile
  const fillTile = id === 'line' || id === 'neonfaces'

  const handleDoubleClick = () => {
    if (href) {
      window.open(href, '_blank', 'noopener')
    } else if (id !== 'twitter' && id !== 'line' && id !== 'coffee' && id !== 'neonfaces') {
      openWindow(id as WindowId)
    }
    setSelected(false)
  }

  return (
    <div
      className="flex flex-col items-center gap-1 cursor-pointer p-1"
      style={{ width: 84 }}
      onClick={() => setSelected(true)}
      onDoubleClick={handleDoubleClick}
      onBlur={() => setSelected(false)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleDoubleClick()}
    >
      <div
        className="w-16 h-16 flex items-center justify-center"
        style={{
          background: selected ? 'var(--nf-ink)' : 'transparent',
          border: selected ? '1px dashed var(--nf-mute)' : '1px dashed transparent',
          padding: fillTile ? 0 : 8,
          overflow: 'hidden',
          color: selected ? 'var(--nf-bg)' : 'var(--nf-ink)',
        }}
      >
        <Icon size={fillTile ? 62 : 44} />
      </div>

      <span
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7,
          color: selected ? 'var(--nf-card)' : 'var(--nf-ink)',
          background: selected ? 'var(--nf-ink)' : 'transparent',
          padding: '1px 3px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          width: '100%',
          minHeight: 28,
          wordBreak: 'break-word',
          lineHeight: 1.7,
        }}
      >
        {label}
      </span>
    </div>
  )
}
