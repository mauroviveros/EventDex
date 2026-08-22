import { type EventRange, toZonedIso } from "@eventdex/domain";

/**
 * Lo mínimo que necesita el structured data. Estructural y no el tipo de la
 * query: así `seo.ts` no se entera si mañana la landing pide más columnas.
 */
export interface EventForJsonLd {
  title: string;
  edition_label: string | null;
  summary: string | null;
  timezone: string;
  venue: {
    name: string;
    address_line: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
}

interface Input {
  event: EventForJsonLd;
  range: EventRange;
  url: URL;
  organizationName: string;
}

/**
 * Structured data del evento para Google (schema.org/Event).
 *
 * Es lo que hace que el resultado de búsqueda muestre fecha y lugar en vez de
 * solo título y dos líneas.
 *
 * `name`, `startDate` y `location` son los campos OBLIGATORIOS: sin los tres el
 * rich result no aparece. `eventAttendanceMode` es el que más se olvida y el
 * que decide si Google muestra la dirección.
 *
 * Las fechas van con el offset del evento y no en UTC: Google usa `startDate`
 * para mostrar el DÍA, y un evento que arranca 21:00 GMT-3 es medianoche UTC
 * del día siguiente. Ver `toZonedIso`.
 */
export function eventJsonLd({ event, range, url, organizationName }: Input) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.edition_label ? `${event.title} ${event.edition_label}` : event.title,
    startDate: toZonedIso(range.start, event.timezone),
    endDate: toZonedIso(range.end, event.timezone),
    // Es presencial: sin esto Google no sabe si hay que ir a algún lado.
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: url.href,
    ...(event.summary && { description: event.summary }),
    ...(event.venue && {
      location: {
        "@type": "Place",
        name: event.venue.name,
        address: {
          "@type": "PostalAddress",
          ...(event.venue.address_line && { streetAddress: event.venue.address_line }),
          ...(event.venue.city && { addressLocality: event.venue.city }),
          ...(event.venue.state && { addressRegion: event.venue.state }),
          ...(event.venue.postal_code && { postalCode: event.venue.postal_code }),
          ...(event.venue.country && { addressCountry: event.venue.country }),
        },
      },
    }),
    organizer: {
      "@type": "Organization",
      name: organizationName,
      url: url.origin,
    },
  };
}
