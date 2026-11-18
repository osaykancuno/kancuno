// The names K1N0 and K4NCUN0 end with the digit zero. In the display font a zero looks like the
// letter O, so their zero is drawn with the mono font's dotted zero (copying the text still gives
// a plain "0").
const NAMES = /(K1N0|K4NCUN0)/

export function Zt({ children }: { children: string }) {
  return (
    <>
      {children.split(NAMES).map((part, i) =>
        i % 2 ? <span key={i}>{part.slice(0, -1)}<span className="k-zero">0</span></span> : part,
      )}
    </>
  )
}
