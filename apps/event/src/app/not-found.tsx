import { ArrowLeft } from "@nsmr/pixelart-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Página no encontrada" };

/**
 * 404 del sitio. Es la pantalla a la que caen los QR de stands que ya no
 * existen o que son de una edición anterior del evento, así que no alcanza con
 * avisar del error: tiene que ofrecer una salida, igual que `SpotInactive`.
 */
export default function NotFound() {
  return (
    <section className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center gap-4 px-4 py-8">
      <Card className="highlight w-full max-w-2xl" variant="pixel">
        <CardContent className="flex flex-col items-center justify-center space-y-4 px-4 py-10 text-center">
          <h1 className="font-press-start text-2xl text-secondary">
            404 - Página no encontrada
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            El link no existe o quedó viejo. Si escaneaste un QR, puede ser de
            una edición anterior del evento.
          </p>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link href="/">
          <ArrowLeft className="size-5" />
          Volver al inicio
        </Link>
      </Button>
    </section>
  );
}
