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
        'normie-bg':    '#e3e5e4',
        'normie-dark':  '#48494b',
        'normie-white': '#ffffff',
        'normie-black': '#000000',
        'normie-gray':  '#c8cac9',
        'normie-mid':   '#9a9c9b',
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
