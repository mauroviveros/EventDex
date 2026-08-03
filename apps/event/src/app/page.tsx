import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveEvent } from "@/server/events";
import { getOrganization } from "@/server/organization";
import type { Event } from "@/types";
import { resolveScheduleDateTime } from "@/utils";
import Upcoming from "./_components/upcoming";

// La landing se genera estáticamente y se revalida cada hora (ISR): sus datos
// (evento, ubicación, horario) cambian rara vez, y la cuenta regresiva es
// client-side, así que se sirve desde CDN sin sacrificar frescura.
//
// El evento que se muestra ahora se elige por fecha, así que la revalidación es
// también lo que hace que la landing pase sola al evento siguiente: como mucho
// tarda una hora en enterarse.
export const revalidate = 3600;

/**
 * La landing no define `title`: hereda el del layout, que ya es
 * `<evento> | <organización> | Eventdex`. Solo agrega lo suyo —canonical, OG y
 * Twitter—, con el título completo porque las tarjetas sociales se comparten
 * fuera del sitio y ahí el contexto lo tiene que dar el texto.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [event, organization] = await Promise.all([
    getActiveEvent(),
    getOrganization(),
  ]);

  const title = [event?.title, organization?.name].filter(Boolean).join(" | ");
  const description = event?.description ?? undefined;
  const images = ["/logo.png"];

  return {
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "es_AR",
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/**
 * Structured data (schema.org/Event) para rich results en buscadores.
 * Las fechas se normalizan a ISO 8601 con `resolveScheduleDateTime` (igual que
 * el resto de la app interpreta los horarios de la DB).
 */
function eventJsonLd(event: Event) {
  const [schedule] = event.schedules;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? undefined,
    startDate: schedule
      ? resolveScheduleDateTime(schedule.start_datetime).toISO()
      : undefined,
    endDate: schedule
      ? resolveScheduleDateTime(schedule.end_datetime).toISO()
      : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.location.address,
        addressLocality: event.location.city,
        addressRegion: event.location.state,
        addressCountry: event.location.country,
      },
    },
  };
}

/** Sin eventos publicados no hay nada que contar, pero la landing sigue viva. */
function NoEvent() {
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-2 py-8 min-h-[calc(100dvh-5rem)]">
      <Card className="highlight mx-4">
        <CardContent className="font-press-start text-center space-y-2 px-2">
          <h1 className="text-2xl text-secondary text-balance">
            No hay eventos por ahora
          </h1>
          <p className="text-xs text-muted-foreground text-pretty">
            Volvé pronto: en cuanto anunciemos el próximo, aparece acá.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export default async function Home() {
  const event = await getActiveEvent();
  if (!event) return <NoEvent />;

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD serializado desde datos propios del evento
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(event)) }}
      />
      <Upcoming event={event} />
    </>
  );
}
