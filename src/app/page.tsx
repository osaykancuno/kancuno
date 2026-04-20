import { WindowManagerProvider } from '@/components/WindowManager'
import Desktop from '@/components/Desktop'
import MobileLayout from '@/components/MobileLayout'

export default function Home() {
  return (
    <WindowManagerProvider>
      {/* Desktop: full OS experience */}
      <div className="hidden md:block">
        <Desktop />
      </div>
      {/* Mobile: scrollable accordion */}
      <div className="block md:hidden">
        <MobileLayout />
      </div>
    </WindowManagerProvider>
  )
}
