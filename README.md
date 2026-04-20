# kancuno.com

Portfolio website for **@osaykancuno** — styled as a retro Windows 95/98 desktop OS, themed around [The Normies](https://www.normies.app/) NFT community.

## What it is

A fully interactive desktop environment in the browser:

- Draggable, resizable windows with minimize / maximize / close controls
- START menu and taskbar with smart focus/minimize/restore logic
- Dark mode toggle (default) with localStorage persistence
- Monochrome pixel art aesthetic (Press Start 2P + VT323 fonts)
- Tools and projects built for The Normies and Khôra/BOOA communities

## Stack

- **Next.js 14** — App Router, TypeScript, static export
- **Tailwind CSS** — custom Normies palette
- **Framer Motion** — draggable windows
- **Google Fonts** — Press Start 2P, VT323

## Windows

| App | Content |
|-----|---------|
| `PROFILE.EXE` | Bio and social links |
| `WORKS.EXE` | NFT collections, frameworks, services |
| `NORMIES.EXE` | The Normies community + 6 tools |
| `KHORAFUN.EXE` | Khôra / BOOA community + 2 tools |
| `CONTACT.EXE` | Contact and booking |

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Deployed on [Vercel](https://vercel.com) with automatic deploys on push to `master`.
