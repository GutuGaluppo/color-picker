import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          bg: '#f5f5dc',
          text: '#1a1a1a',
          border: '#2a2a2a',
          muted: '#6b6b6b',
          hover: '#e8e8d0',
          accent: '#000000',
        },
      },
      fontFamily: {
        mono: ['"Courier New"', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
