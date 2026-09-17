import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Psico·Flujo | Biblioteca de evaluación psicológica",
  description:
    "Instrumentos de evaluación psicológica de uso libre, organizados en seis ejes, con ficha técnica verificada.",
  metadataBase: new URL("https://psico-flujo.vercel.app"),
  openGraph: {
    title: "Psico·Flujo | Evaluar para comprender",
    description:
      "Instrumentos de evaluación psicológica de uso libre, organizados en seis ejes, con ficha técnica verificada.",
    images: ["/hero-psicoflujo.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Psico·Flujo | Evaluar para comprender",
    description:
      "Instrumentos de evaluación psicológica de uso libre, organizados en seis ejes, con ficha técnica verificada.",
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
