import type { Metadata } from 'next'
import { Atkinson_Hyperlegible, Caveat, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const atkinson = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-atkinson',
  display: 'swap',
})
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', display: 'swap' })

export const metadata: Metadata = {
  title: 'Teatro del Globo — Platea',
  description: 'Selección de butacas del sector Platea del Teatro del Globo.',
}

const THEME_SCRIPT = `(function(){var k="theme",s=null;try{s=localStorage.getItem(k)}catch(e){}
var p=(s==="light"||s==="dark"||s==="system")?s:"system";
var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
if(d)document.documentElement.classList.add("dark");
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute("content",d?"#1f1c16":"#f1e8d3")})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${atkinson.variable} ${jetbrains.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#f1e8d3" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="bg-paper text-ink">{children}</body>
    </html>
  )
}
