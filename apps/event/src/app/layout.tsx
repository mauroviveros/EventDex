import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { siteUrl } from "@/config/site";
import { getActiveEvent } from "@/server/events";
import { getOrganization } from "@/server/organization";
import { cn } from "@/utils";
import Header from "./_components/header";
import "./globals.css";

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
});

/**
 * Título del sitio: `<evento> | <organización> | Eventdex`.
 *
 * Sale de los datos y no de una constante porque el evento que muestra la app
 * lo elige el calendario (ver `getActiveEvent`): con el título hardcodeado, la
 * pestaña seguía anunciando una edición que ya había pasado.
 *
 * Los tramos que falten se omiten en vez de dejar un separador colgando, así el
 * título sigue siendo válido cuando no hay evento publicado.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [event, organization] = await Promise.all([
    getActiveEvent(),
    getOrganization(),
  ]);

  // Sufijo común: es lo que se le agrega al título propio de cada página.
  const suffix = [organization?.name, "Eventdex"].filter(Boolean).join(" | ");

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: [event?.title, suffix].filter(Boolean).join(" | "),
      template: `%s | ${suffix}`,
    },
    description: event?.description ?? undefined,
    icons: {
      apple: "/apple-touch-icon.png",
      icon: [
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
    },
    manifest: "/site.webmanifest",
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={cn(
        "h-full",
        "antialiased",
        vt323.variable,
        pressStart.variable,
      )}
    >
      <body className="min-h-dvh flex flex-col">
        <Analytics />
        <SpeedInsights />
        <div className="scanlines"></div>
        <Header />

        <main className="container mx-auto mt-14 px-4 pt-2 grow">
          {children}
        </main>
      </body>
    </html>
  );
}
