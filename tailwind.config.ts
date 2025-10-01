import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      container: { center: true, padding: '1rem' },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: [],
} satisfies Config
