import localFont from 'next/font/local'

/** Product UI + brand: Light, Regular, Medium, SemiBold only (300–600). */
export const shazdeFont = localFont({
  src: [
    { path: '../../public/fonts/Shazde-Light.woff2', weight: '300', style: 'normal' },
    { path: '../../public/fonts/Shazde-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/Shazde-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/Shazde-SemiBold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-shazde',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})
