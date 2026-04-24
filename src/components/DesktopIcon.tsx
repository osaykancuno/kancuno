'use client'

import { useState, ComponentType } from 'react'
import { useWindowManager, WindowId } from './WindowManager'

interface DesktopIconProps {
  id: WindowId | 'twitter' | 'line'
  label: string
  Icon: ComponentType<{ size?: number }>
  href?: string
}

export default function DesktopIcon({ id, label, Icon, href }: DesktopIconProps) {
  const { openWindow } = useWindowManager()
  const [selected, setSelected] = useState(false)

  const handleDoubleClick = () => {
    if (href) {
      window.open(href, '_blank', 'noopener')
    } else if (id !== 'twitter' && id !== 'line') {
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
          background: selected ? '#48494b' : 'transparent',
          border: selected ? '1px dashed #9a9c9b' : '1px dashed transparent',
          padding: 8,
          color: selected ? '#e3e5e4' : '#48494b',
        }}
      >
        <Icon size={44} />
      </div>

      <span
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7,
          color: selected ? '#ffffff' : '#48494b',
          background: selected ? '#48494b' : 'transparent',
          padding: '1px 3px',
          textAlign: 'center',
          display: 'block',
          width: '100%',
          wordBreak: 'break-word',
          lineHeight: 1.7,
        }}
      >
        {label}
      </span>
    </div>
  )
}
