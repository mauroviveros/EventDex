import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/utils";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Eventdex Dashboard",
    default: "Eventdex Dashboard",
  },
  description: "Dashboard de organizadores: administrá tus eventos y spots.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<React.PropsWithChildren>) {
  return (
    <html lang="es" className={cn("h-full antialiased", inter.variable)}>
      <body className="min-h-dvh">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
