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
      <body className="bg-paper text-ink">
        <div
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: La sala entera siempre visible y una regla al alcance del pulgar que la barre fila por fila. Refusa el arreglo por defecto de la categoria: mapa con pinch-zoom y panel lateral, que en un telefono obliga a elegir entre ver la sala y ver la butaca.
OWN-WORLD: Papel crema y tinta, monocromo estricto; la tarifa se lee en densidad de trazo y la ocupada va tachada, nunca por color. Reglas de 1px, sin sombras ni gradientes. Caveat solo display; Atkinson Hyperlegible para todo lo funcional.
STORY: El visitante entiende la sala de un vistazo, ve fila y precio antes de tocar nada, elige hasta 8 butacas sin fallar un target, y llega a una confirmacion que aclara que no se cobro nada.
FIRST VIEWPORT: Cabecera con el nombre del teatro en Caveat; debajo el plano completo en arco con numeros de fila en los extremos y las franjas rotuladas; debajo la fila activa a tamano de dedo; la regla; y fija abajo la barra con "n de 8", el total y Continuar.
FORM: La regla, indice 4 de la lista ordenada, seed key 6d9c0709 (re-roll 2, code-led).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
