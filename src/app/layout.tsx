import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:{default:'GRAPHITE — Architecture Office',template:'%s — GRAPHITE'},description:'Graphite Architecture Office',robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fa" dir="rtl"><body>{children}</body></html>}
