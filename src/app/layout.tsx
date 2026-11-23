import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vórtex Formatter - JSON, Base64 y hashes para devs, sin límites",
  description:
    "Vórtex Formatter, de Vortex Company: formatea y valida JSON, minifica, ordena claves, convierte Base64/Base64-URL, decodifica URLs y JWT, y calcula hashes MD5 y SHA. Todo se calcula en tu navegador, tus datos nunca salen de tu equipo. Gratis, sin anuncios y 100% local.",
  keywords: [
    "Vórtex Formatter",
    "formatear JSON",
    "validar JSON",
    "Base64 online",
    "hash MD5 SHA-256",
    "herramientas dev",
    "sin anuncios",
  ],
  authors: [{ name: "Vortex Company" }],
  icons: {
    icon:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#161616"/><circle cx="24" cy="24" r="17" fill="none" stroke="#60a5fa" stroke-width="3.5"/><path d="M18 18l-6 6 6 6M30 18l6 6-6 6M26 16l-4 16" stroke="#93c5fd" stroke-width="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>`
      ),
  },
  openGraph: {
    title: "Vórtex Formatter - JSON, Base64 y hashes para devs, sin límites",
    description:
      "Vórtex Formatter, de Vortex Company: JSON, Base64, URL, JWT y hashes MD5/SHA calculados en tu navegador. Gratis, sin anuncios y 100% local.",
    siteName: "Vórtex Formatter - JSON, Base64 y hashes para devs, sin límites",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[#0f0f10] text-[#ececf1]">{children}</body>
    </html>
  );
}
