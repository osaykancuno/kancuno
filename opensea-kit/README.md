# OpenSea · THE K.LAB

Everything for the collection page. Images in this folder: `logo.png` (Logo, 350×350, made at 2×), `banner.png` (Banner, 1400×350, made at 2×), `featured.png` (Featured image, 600×400, made at 2×). They show K1N0 exactly as the contract draws them.

## Collection settings

- **Name:** THE K.LAB
- **URL slug:** `the-k-lab` (or `k1n0` if taken)
- **Category:** Art
- **Links:** Website `https://www.kancuno.com/klab` · X `https://x.com/OsayKancuno`
- **Creator earnings:** your choice (the contract's own royalty is 0% until you set it with `setRoyalty`)
- **Display theme:** Contained (the pieces are square)
- **Explicit content:** off
- **Traits:** keep them as they come from the contract. Colours and Looks are numbers; the rest are text. Suggested order on the page: Background, Centre, Front left, Front right, then the effects, Speed, Colours, Looks.

## Description (OpenSea, markdown)

**One symbol, infinite variations.** K1N0 is a symbol of crypto and pop culture, and it belongs to everyone: take it, remix it, make it yours.

K1N0 in clay-like 3D: seven blocks for a head over an X. The X and four blocks of the head are always black; the other four colours are its own: the background, the centre block and the two front blocks. 16 colours in the palette, and **every combination can be minted only once.** You pick its number, from 1 to 8,362, or press Random.

**The look is alive.** The four colours are fixed forever at mint; the art keeps moving. Whoever holds a K1N0 gives each of its colours an effect (glow, pulse, blink, float, shimmer, neon, metal, glitch; the background has its own), sets the speed and the 3D view. Each change costs only gas, and every look stays on-chain with who set it and when. When a K1N0 changes hands, its story goes on with the next holder.

**CC0.** K1N0 is public domain (https://creativecommons.org/publicdomain/zero/1.0/): use it, remix it, build on it, commercial work included.

**Fully on-chain on Ethereum.** The contract draws the image in 3D and an interactive 3D piece you can turn right here: drag it, scroll to zoom. No IPFS, no server.

Design yours in THE K.LAB, no wallet needed: kancuno.com/klab

## Short texts

- **Tagline (≤ 80):** One symbol. Infinite variations. Four colours, a living look.
- **Short description (≤ 160):** 8,362 K1N0 in 3D, fully on-chain. Four colours that are yours alone, and a look you keep changing for the gas only. CC0, for everyone.

## Launch post (X)

THE K.LAB is open.

Design your K1N0 in the browser, pick four colours nobody else has, mint it as a K1N0. Then give it a look: an effect for each colour, changed whenever you like, every look kept on-chain.

8,362 · 0.0024 ETH · fully on-chain
kancuno.com/klab

## Thread (X)

1/ K1N0 is a symbol for everyone: seven blocks for a head over an X, in clay-like 3D. In THE K.LAB anyone makes their own, no wallet needed. As a K1N0 the X and four blocks stay black, and it takes four colours of its own: background, centre, two front blocks.

2/ Every combination of the four can be minted once. When it is yours, nobody can mint it again. You also pick your number from 1 to 8,362, or press Random.

3/ The look is alive. Glow, pulse, float, neon, metal… one effect per colour, plus speed and 3D view. Gas only, as often as you like, every look on-chain with your name. When it changes hands, the story goes on.

4/ Nothing sits off-chain: the contract draws the 3D image and the interactive piece you turn on OpenSea. No IPFS, no server. 0.0024 ETH. kancuno.com/klab

## Notes for collectors (FAQ, optional)

- **Before buying,** check the token page (kancuno.com/klab/token?id=…): its looks are listed with dates. A holder can change the look until the sale; the colours never change.
- **What a holder can change:** only the look (an effect per colour, speed, 3D view). The image and the 3D piece here always show the latest look; OpenSea refreshes on its own (the contract signals every change, EIP-4906). A holder can also let an app set looks for them (looks only, never transfers); a marketplace approved to sell a K1N0 cannot touch its look.
- **What can evolve, and what never will:** the number, the four colours, every look already set and the cap of 8,362 (plus #0) are permanent. The artist can add new effects and new artwork through a new renderer until it is locked, and new ways to mint the remaining numbers through public extensions (same rules: unique colours, same cap). Every such change is an on-chain event.
- **Minting busy moments:** the number and the colours are public while a transaction waits. If someone takes them first, the mint simply fails (only gas is spent). A private RPC such as Flashbots Protect avoids that.
