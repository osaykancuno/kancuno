import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette tokens live in globals.css (NEONFACES + Normies intro palette)
        'nf-bg':   'var(--nf-bg)',
        'nf-ink':  'var(--nf-ink)',
        'nf-text': 'var(--nf-text)',
        'nf-card': 'var(--nf-card)',
        'nf-edge': 'var(--nf-edge)',
        'nf-soft': 'var(--nf-soft)',
        'nf-mute': 'var(--nf-mute)',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        vt: ['"VT323"', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
