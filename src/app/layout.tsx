import type {Metadata} from 'next';
import './globals.css';

export const metadata:Metadata={
  title:{default:'GRAPHITE — Architecture Office',template:'%s — GRAPHITE'},
  description:'Graphite Architecture Office',
  robots:{index:true,follow:true},
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/Shazde-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Shazde-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
