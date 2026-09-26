import { Inter } from 'next/font/google'

/** English UI stack — not Shazde (Persian-first Latin is weaker for EN body copy). */
export const interFont = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})
