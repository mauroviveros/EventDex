"use client";

import { Check, Copy, Download, QrCode } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Vuelve a "Copiar" después de un rato: el tilde es un acuse, no un estado. */
const COPIED_MS = 2000;

function CopyUrlButton({ url }: Readonly<{ url: string }>) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // Sin permiso de portapapeles (o fuera de HTTPS) queda el input, que es
      // seleccionable: no hay nada que avisar.
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={copy}
      aria-label={copied ? "Link copiado" : "Copiar link"}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}

type SpotQrDialogProps = Readonly<{
  eventId: string;
  spotId: string;
  name: string;
  /** URL pública del stand; null si la organización no tiene dominio. */
  url: string | null;
}>;

/**
 * QR imprimible del stand. La imagen la sirve la ruta `…/spots/[spotId]/qr`,
 * así que el diálogo la pide recién al abrirse y el mismo endpoint resuelve la
 * descarga.
 */
export function SpotQrDialog({
  eventId,
  spotId,
  name,
  url,
}: SpotQrDialogProps) {
  const src = `/events/${eventId}/spots/${spotId}/qr`;

  if (!url) {
    return (
      <Tooltip>
        {/* El span envuelve al botón deshabilitado: sin él no emite eventos de
            mouse y el tooltip nunca se mostraría. */}
        <TooltipTrigger asChild>
          <span>
            <Button variant="ghost" size="icon" aria-label="Ver QR" disabled>
              <QrCode />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Cargá el dominio de la organización para generar los QR.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Ver QR de ${name}`}
            >
              <QrCode />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Ver QR</TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR de {name}</DialogTitle>
          <DialogDescription>
            Imprimilo y pegalo en el stand: al escanearlo, el visitante suma la
            medalla.
          </DialogDescription>
        </DialogHeader>

        {/* biome-ignore lint/performance/noImgElement: lo sirve una ruta propia que ya devuelve el PNG en su tamaño final; next/image no aporta. */}
        <img
          src={src}
          alt={`Código QR de ${name}`}
          width={256}
          height={256}
          className="mx-auto size-56 rounded-lg border bg-white p-3"
        />

        <div className="flex gap-2">
          <Input
            readOnly
            value={url}
            aria-label="Link del stand"
            onFocus={(event) => event.target.select()}
          />
          <CopyUrlButton url={url} />
        </div>

        <DialogFooter>
          <Button asChild>
            {/* Descarga directa del mismo endpoint: `download` fuerza el
                guardado y la ruta ya manda el nombre de archivo. */}
            <a href={`${src}?download`} download>
              <Download />
              Descargar PNG
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
