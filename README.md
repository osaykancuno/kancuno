# kancuno.com

Portfolio website for **@osaykancuno** — styled as a retro Windows 95/98 desktop OS, themed around [The Normies](https://www.normies.art/) NFT community.

## What it is

A fully interactive desktop environment in the browser:

- Draggable, resizable windows with minimize / maximize / close controls
- START menu and taskbar with smart focus/minimize/restore logic
- Dark mode toggle (default) with localStorage persistence
- NEONFACES neon palette (#CCFF00 on black) with a Normie → neon glitch intro on every visit
- Pixel art aesthetic (Press Start 2P + VT323 fonts)
- Tools and projects built for The Normies and BOOA communities

## Stack

- **Next.js 14** — App Router, TypeScript, static export
- **Tailwind CSS** — palette tokens (`--nf-*`) defined in `globals.css`
- **Framer Motion** — draggable windows
- **Google Fonts** — Press Start 2P, VT323

## Windows

| App | Content |
|-----|---------|
| `NEONFACES` | Link to neonfaces.xyz (main project) |
| `PROFILE.EXE` | Bio, founder of NEONFACES, THE100 member + holder |
| `WORKS.EXE` | Personal works + tools built with BOOA (formerly Khôra) |
| `NORMIES.EXE` | The Normies community, Normifesto + 8 tools |
| `CONTACT.EXE` | X / Twitter and Telegram |
| `8362 COFFEE` / `NORMIES YACHT CLUB` | External links |

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Deployed on [Vercel](https://vercel.com) with automatic deploys on push to `master`.
