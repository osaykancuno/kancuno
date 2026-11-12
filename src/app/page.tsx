import Experience from '@/components/experience/Experience'

export default function Home() {
  return (
    <>
      {/* Plain-text summary for screen readers, search engines and AI crawlers:
          the 3D experience shows one chapter at a time. */}
      <section className="sr-only" aria-label="Summary">
        <h1>Osay Kancuno (K4NCUN0), artist and builder on-chain</h1>
        <p>
          Osay Kancuno (K4NCUN0, @OsayKancuno on X) is an artist and builder on-chain, currently building something new.
          His work spans games, tools, frameworks and video, including projects for communities he belongs to.
        </p>
        <p>
          Osay Kancuno is a member and holder of THE100 in The Normies community,
          with Normie #8362 as on-chain PFP, and builds community tools for The Normies.
        </p>
        <p>
          Osay Kancuno is also a JPEG Frens holder who contributes to the community: he made{' '}
          <a href="https://kx499cjd.srstudio.dev/">The Frens Forge</a>, a burn-and-forge game on The Wall Arcade by SuperRare Studio,
          and he creates FRENS AFTER DARK, a video mini-series for JPEG Frens. Season 2 is airing on X:{' '}
          <a href="https://x.com/OsayKancuno/status/2120201931423420808">Episode 2, &quot;Touch Grass Protocol&quot;</a> (10 November 2026) and{' '}
          <a href="https://x.com/OsayKancuno/status/2120563587244576871">Episode 3, &quot;Hold The Button&quot;</a> (11 November 2026).
        </p>
        <p>
          At NFC, Osay Kancuno is a holder who contributes to the community, and one of the
          &quot;People of the Wall&quot; at NFC 2027 (NFC Summit, Lisbon, 27-29 May 2027,
          Unicorn Factory): his name, K4NCUN0, is painted on the event&apos;s wall at Panel #33, category Builders.{' '}
          <a href="https://onthewall.nfcsummit.com/people/k4ncun0">See the wall profile</a>.
        </p>
        <p>
          Also founder of Normies Yacht Club (normiesyachtclub.com) and 8362 Coffee (8362coffee.com).
          Contact: X @OsayKancuno, Telegram @kancuno.
        </p>
      </section>
      <Experience />
    </>
  )
}
