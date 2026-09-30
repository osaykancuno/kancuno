import { WindowManagerProvider } from '@/components/WindowManager'
import Desktop from '@/components/Desktop'
import MobileLayout from '@/components/MobileLayout'

export default function Home() {
  return (
    <WindowManagerProvider>
      {/* Plain-text summary for screen readers, search engines and AI crawlers:
          the desktop UI keeps most content inside closed windows. */}
      <section className="sr-only">
        <h1>Osay Kancuno: Founder of NEONFACES, member and holder of THE100 in The Normies</h1>
        <p>
          Osay Kancuno (K4NCUN0, @OsayKancuno on X) is the founder of NEONFACES
          (neonfaces.xyz): 5555 close-up pixel faces, fully on-chain on Robinhood Chain.
          Every Face is a wallet that holds a small piece of the market. Tagline: They don&apos;t blink.
        </p>
        <p>
          Osay Kancuno is a member and holder of THE100 in The Normies community,
          with Normie #8362 as on-chain PFP, and builds community tools for The Normies.
        </p>
        <p>
          Also founder of Normies Yacht Club (normiesyachtclub.com) and 8362 Coffee (8362coffee.com).
          Contact: X @OsayKancuno, Telegram @kancuno.
        </p>
      </section>
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
