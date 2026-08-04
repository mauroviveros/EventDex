# 00 — Visión y glosario

## Qué es Eventdex

Plataforma multi-tenant de eventos presenciales con **mecánica de colección**: el
visitante recorre el predio escaneando QRs distribuidos en stands y atracciones,
junta "medallas", y al cierre el organizador sortea un premio entre quienes
participaron.

Eventdex vende el servicio a **organizaciones** (productoras, municipios, expos).
Cada organización administra sus propios eventos, con su propio dominio.

## El problema del modelo v1

La v1 asume **un deployment por evento**: `EVENTDEX_EVENT_ID` fijo en las variables
de entorno, y después `EVENTDEX_ORGANIZATION_ID` con la elección del evento resuelta
en JavaScript. Eso arrastra tres límites:

1. **Los spots viven adentro del evento.** `event_spots.event_id` es obligatorio, así
   que la edición 2027 de una expo obliga a recargar los 80 stands a mano.
2. **No hay concepto de edición.** `events.edition` es un `text` suelto: nada relaciona
   "Expo Ubbe 2026" con "Expo Ubbe 2027".
3. **La autorización vive toda en el código.** Casi todas las lecturas administrativas
   usan la `service_role` key, que se saltea RLS. Un bug en una server action expone
   datos de otra organización.

La v2 ataca esos tres puntos. Todo lo demás (la mecánica de medallas, el sorteo,
el countdown) se conserva porque funciona.

## Actores

| Actor | Quién es | Alcance |
|-------|----------|---------|
| **Visitante** | Persona que asiste al evento y colecciona medallas | Un evento |
| **Expositor** (`exhibitor`) | Quien atiende un stand y mantiene sus datos | Sus spots dentro de un evento |
| **Staff** | Miembro operativo de la organización o de un evento puntual | Organización o evento |
| **Owner** | Dueño de la organización, última palabra | Organización completa |
| **Developer** | Vos (y quien designes): soporte y facturación cross-org | Toda la plataforma |

El detalle de qué puede hacer cada uno está en [02 — Roles y permisos](./02-roles-y-permisos.md).

> **Sobre el nombre del quinto rol.** Pediste un nombre para el "SPOT_OWNER".
> La propuesta es **`exhibitor`** (expositor): es el término de industria para quien
> atiende un stand en una expo, y —a diferencia de `spot_owner`— no se confunde
> visualmente con `owner`, que en este modelo significa otra cosa muy distinta
> (dueño de la organización). Alternativas descartadas: `vendor` (implica venta),
> `host` (ambiguo con anfitrión del evento), `stand_manager` (largo y no aplica a
> atracciones). Ver [ADR-0004](./adr/0004-modelo-de-roles.md).

## Glosario

Vocabulario único: si un concepto se llama de una forma acá, se llama igual en la
base de datos, en el código y en la interfaz.

| Término | Significado | Tabla |
|---------|-------------|-------|
| **Organización** | Cliente de Eventdex. Dueña de eventos, spots y dominio | `organizations` |
| **Serie** | Evento recurrente como concepto: "Expo Ubbe" | `event_series` |
| **Evento** | Una edición concreta de una serie: "Expo Ubbe 2026" | `events` |
| **Jornada** | Bloque de horario de un evento: "Día 1, 14:00 a 22:00" | `event_schedules` |
| **Sede** | Lugar físico reutilizable entre ediciones | `venues` |
| **Spot** | Stand o atracción **del catálogo** de la organización, sin evento | `spots` |
| **Spot del evento** | Un spot puesto en un evento, con sus datos de esa edición | `event_spots` |
| **Registro** | Un visitante inscripto a un evento | `event_registrations` |
| **Reclamo** | Un escaneo válido: el visitante consiguió la medalla de un spot | `spot_claims` |
| **Sorteo** | Configuración de un sorteo de un evento | `raffles` |
| **Extracción** | Una tirada concreta del sorteo, con su ganador | `raffle_draws` |
| **Fase** | Estado temporal derivado: borrador / próximo / en curso / finalizado | *(calculado)* |

### Dos palabras que la v1 usaba mal

- **"medalla"** era el nombre en el código (`collectMedal`, `getUserMedalHistory`)
  pero la tabla se llamaba `user_spot_history`. En v2 el concepto es **reclamo**
  (`spot_claims`); "medalla" queda como término de interfaz para el visitante.
- **"status"** significaba tres cosas distintas: publicación del evento, actividad
  del spot y fase temporal. En v2 se separan: `status` es solo ciclo de vida
  editorial, y la **fase** temporal se calcula, nunca se guarda.

## No-objetivos de la v1 del rediseño

Explícitamente fuera de alcance para no inflar el scope:

- Venta de entradas / ticketing.
- Pagos online (la facturación se registra y se marca a mano, ver `event_invoices`).
- Multi-idioma en la app pública.
- App móvil nativa.
- Panel del expositor (el modelo lo contempla, la UI queda para v2 — ver [06](./06-roadmap.md)).
