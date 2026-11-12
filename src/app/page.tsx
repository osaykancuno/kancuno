import Experience from '@/components/experience/Experience'

export default function Home() {
  return (
    <>
      {/* Plain-text summary for screen readers, search engines and AI crawlers:
          the 3D experience shows one chapter at a time. */}
      <section className="sr-only" aria-label="Summary">
        <h1>Osay Kancuno, builder on-chain</h1>
        <p>
          Osay Kancuno (K4NCUN0, @OsayKancuno on X) is an on-chain builder, currently building something new.
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
      <Experience />
    </>
  )
}
