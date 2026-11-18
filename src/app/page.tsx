import Experience from '@/components/experience/Experience'

export default function Home() {
  return (
    <>
      {/* Plain-text summary for screen readers, search engines and AI crawlers:
          the 3D experience shows one chapter at a time. */}
      <section className="sr-only" aria-label="Summary">
        <h1>Osay Kancuno (K4NCUN0), artist and builder on-chain</h1>
        <p>
          Osay Kancuno (K4NCUN0, @OsayKancuno on X) is an artist and builder on-chain.
          He made <a href="/klab">THE K.LAB</a>.
          His motto: &quot;Culture belongs to the people who create it.&quot;
        </p>
        <h2>THE K.LAB</h2>
        <p>
          <a href="/klab">THE K.LAB</a> is his creative lab built on his own symbol, the K: one symbol, infinite variations.
          Free tools in the browser (K Editor, Pixel Forge, Animation Bench, SVG Suite, Touch Field, Image Wrap) to create, remix and animate your own K,
          with no wallet needed. Optional mint: K1N0, 8,362 Ks fully on-chain on Ethereum. Each has four colours of its own that never change,
          and a look its holder keeps changing for the gas only, kept on-chain with its story.
        </p>
        <h2>Side quests</h2>
        <p>
          Side quests, on-chain and off-chain. Side quest 001, off-chain, live: <a href="https://jamverse.kancuno.com/">JAMVERSE</a>, a live music universe in 3D.
          Make a full song alone or jam it with friends in real time: every part (drums, bass, chords, melody, texture, voice)
          is a ring you can step into. It includes a step sequencer, piano roll, song arranger and mixer, and exports WAV, stems or MIDI.
          Free, in the browser.
        </p>
        <h2>Community work</h2>
        <p>
          He also makes games, tools and video for the communities he belongs to, as a holder.
        </p>
        <p>
          Osay Kancuno is a member and holder of THE100 in The Normies community,
          with Normie #8362 as on-chain PFP, and builds community tools for The Normies.
        </p>
        <p>
          Osay Kancuno is also a JPEG Frens holder who contributes to the community: he made{' '}
          <a href="https://kx499cjd.srstudio.dev/">The Frens Forge</a>, a burn-and-forge game on The Wall Arcade by SuperRare Studio,
          and he creates FRENS AFTER DARK, a video mini-series for JPEG Frens on X, now in its second season:{' '}
          <a href="https://x.com/OsayKancuno/status/2119116948881457640">Season 1, Episode 5, &quot;No Risk, No Sheet&quot;</a> (7 November 2026) and{' '}
          <a href="https://x.com/OsayKancuno/status/2121274266490388930">Season 2, Episode 5, &quot;Mint Condition&quot;</a> (13 November 2026).
        </p>
        <p>
          At NFC, Osay Kancuno is a holder who contributes to the community, and one of the
          &quot;People of the Wall&quot; at NFC 2027 (NFC Summit, Lisbon, 27-29 May 2027,
          Unicorn Factory): his name, K4NCUN0, is painted on the event&apos;s wall at Panel #33, category Builders.{' '}
          <a href="https://onthewall.nfcsummit.com/people/k4ncun0">See the wall profile</a>.
        </p>
        <p>
          Also founder of Normies Yacht Club (normiesyachtclub.com), pixel-art yachts that live entirely on Ethereum,
          each one born from a burned Normie, and creator of 8362 Coffee (8362coffee.com), a real-world coffee brand tied to Normie #8362.
          Contact: X @OsayKancuno, Telegram @kancuno.
        </p>
      </section>
      <Experience />
    </>
  )
}
