import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../lib/providers"
import { Nav } from "../components/layout/Nav"
import { PlayerBar } from "../components/player/PlayerBar"

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
            Layout de 3 columnas (estilo escritorio clásico, moderno):
            nav flotante a la izquierda · contenido centrado · reproductor a la
            derecha. El contenido lleva padding SIMÉTRICO en lg+ para quedar
            centrado en el hueco entre ambas barras (no empujado a un lado).
            En móvil/mediano, nav y reproductor son flotantes abajo.
          */}
          <div className="flex-1 pb-40 md:pb-24 lg:px-72 lg:pb-8">
            {children}
          </div>
          <PlayerBar />
        </Providers>
      </body>
    </html>
  );
}
