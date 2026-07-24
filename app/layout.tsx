import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Psico·Flujo | Biblioteca de evaluación psicológica",
  description:
    "Portal en evolución para explorar y descargar instrumentos de evaluación psicológica organizados en seis ejes clínicos.",
  metadataBase: new URL("https://psico-flujo.vercel.app"),
  openGraph: {
    title: "Psico·Flujo | Evaluar para comprender",
    description:
      "Biblioteca de instrumentos de evaluación psicológica organizada en seis ejes clínicos.",
    images: ["/hero-psicoflujo.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Psico·Flujo | Evaluar para comprender",
    description:
      "Biblioteca de instrumentos de evaluación psicológica organizada en seis ejes clínicos.",
    images: ["/hero-psicoflujo.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
