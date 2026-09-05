import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../lib/providers"
import { Nav } from "../components/layout/Nav"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spotify Clone",
  description: "Proyecto de aprendizaje",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Nav />
          {/*
            El contenido se centra respecto a TODA la pantalla (las páginas usan
            mx-auto max-w-*). El nav es fixed → flota encima a la izquierda sin
            ocupar espacio, así el contenido no se descentra. Solo reservamos
            espacio inferior en móvil, donde el nav flota abajo.
          */}
          <div className="flex-1 pb-24 md:pb-0">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
