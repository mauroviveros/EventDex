import QRCode from "qrcode";
import { getCurrentUser, getMembership } from "@/server/auth";
import { getOrganizationEvent } from "@/server/events";
import { getEventSpot } from "@/server/spots";
import { spotPublicUrl } from "@/utils";

/**
 * Lado del PNG. 1024 px alcanza para imprimir el cartel en A4 sin que se vea
 * pixelado y sigue pesando pocos KB.
 */
const SIZE = 1024;

/** Nombre de archivo seguro a partir del nombre del stand. */
function fileName(name: string) {
  const slug = name
    .normalize("NFD")
    // Marcas diacríticas combinantes: "Atracción" → "Atraccion".
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `qr-${slug || "stand"}.png`;
}

/**
 * PNG del QR de un stand, apuntando al `/spot/[id]` de la app pública.
 *
 * Se genera acá y no en la página para no mandar un data URL por stand en el
 * payload de la tabla: el navegador lo pide solo cuando se abre el diálogo, y
 * el mismo endpoint sirve para mostrarlo y para descargarlo (`?download=1`).
 *
 * Devuelve códigos y no redirects como los guards de las páginas: esto lo pide
 * un `<img>`, donde un 307 al login no se ve como error.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; spotId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("No autenticado.", { status: 401 });

  const membership = await getMembership(user.id);
  if (!membership) return new Response("Sin acceso.", { status: 403 });

  const { id, spotId } = await params;

  // El evento se valida contra la organización antes de leer el stand: es lo
  // que impide bajar el QR de un stand ajeno pasando su id.
  const event = await getOrganizationEvent(membership.organization.id, id);
  if (!event) return new Response("Evento inexistente.", { status: 404 });

  const spot = await getEventSpot(id, spotId);
  if (!spot) return new Response("Stand inexistente.", { status: 404 });

  const url = spotPublicUrl(membership.organization.domain, spotId);
  if (!url) {
    return new Response("La organización no tiene dominio configurado.", {
      status: 409,
    });
  }

  // `margin` en módulos: el "quiet zone" que los lectores necesitan alrededor.
  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: SIZE,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  const download = new URL(request.url).searchParams.has("download");

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName(spot.name)}"`,
      // Privado: el QR sale de datos de la organización y viaja por una ruta
      // autenticada, así que no debe quedar en caches compartidos.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
