# Diagrama entidad-relación

## Vista general

```mermaid
erDiagram
    profiles ||--o{ organization_members : "es miembro"
    profiles ||--o| platform_admins : "puede ser"
    profiles ||--o{ event_members : "trabaja en"
    profiles ||--o{ event_registrations : "asiste a"
    profiles ||--o{ event_spot_exhibitors : "atiende"

    organizations ||--o{ organization_domains : "responde en"
    organizations ||--o{ organization_members : "tiene"
    organizations ||--o{ venues : "posee"
    organizations ||--o{ spots : "cataloga"
    organizations ||--o{ event_series : "produce"
    organizations ||--o{ events : "organiza"
    organizations ||--o{ event_invoices : "se le factura"

    event_series ||--o{ events : "tiene ediciones"
    venues ||--o{ events : "aloja"

    events ||--o{ event_schedules : "tiene jornadas"
    events ||--o{ event_members : "tiene equipo"
    events ||--o{ event_spots : "incluye"
    events ||--o{ event_registrations : "recibe"
    events ||--o{ raffles : "sortea"

    spots ||--o{ event_spots : "participa en"
    event_spots ||--o{ event_spot_exhibitors : "es atendido por"
    event_spots ||--o{ spot_claims : "entrega"

    event_registrations ||--o{ spot_claims : "habilita"

    raffles ||--o{ raffle_draws : "extrae"
```

## El cambio central: spots fuera del evento

```mermaid
erDiagram
    organizations ||--o{ spots : "catálogo reutilizable"
    organizations ||--o{ events : ""
    events ||--o{ event_spots : ""
    spots ||--o{ event_spots : ""

    spots {
        uuid id PK
        uuid organization_id FK
        citext slug
        text name
        text description
        spot_type type
        text avatar_path
        timestamptz archived_at
    }

    event_spots {
        uuid id PK "apunta el QR"
        uuid event_id FK
        uuid spot_id FK
        citext code "A12"
        text name_override "de esta edición"
        text description_override
        text avatar_path_override
        text booth
        event_spot_status status "activo/inactivo"
        int points
        jsonb snapshot "congelado al publicar"
        timestamptz deleted_at
    }
```

`spots` es el catálogo de la organización. `event_spots` es la relación, y lleva
todo lo que es propio de *esa* edición: el código del QR, el puesto, si está
activo, y los overrides. Ver
[03 — Copia vs. referencia](./03-modelo-de-datos.md#copia-vs-referencia-la-resolución).

## Series y ediciones

```mermaid
erDiagram
    event_series ||--o{ events : ""

    event_series {
        uuid id PK
        uuid organization_id FK
        citext slug "expo-ubbe"
        text name "Expo Ubbe"
    }

    events {
        uuid id PK
        uuid series_id FK "null = evento único"
        uuid venue_id FK
        citext slug
        text title
        text edition_label "2026"
        int edition_number "1"
        event_status status "draft/published/archived/cancelled"
        event_visibility visibility
        timestamptz published_at
    }
```

## Roles: los tres niveles

```mermaid
erDiagram
    profiles ||--o| platform_admins : "cross-org"
    profiles ||--o{ organization_members : "nivel organización"
    profiles ||--o{ event_members : "nivel evento"
    profiles ||--o{ event_registrations : "nivel visitante"

    platform_admins {
        uuid user_id PK
        platform_role level "developer / support"
    }

    organization_members {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        organization_role role "owner / staff"
        membership_status status
    }

    event_members {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        event_role role "manager / staff / exhibitor"
    }

    event_registrations {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        registration_status status "active / blocked"
    }
```

## Participación

```mermaid
erDiagram
    events ||--o{ event_registrations : ""
    events ||--o{ raffles : ""
    event_registrations ||--o{ spot_claims : "FK compuesta"
    event_spots ||--o{ spot_claims : ""
    raffles ||--o{ raffle_draws : ""

    event_registrations {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        registration_status status
        timestamptz registered_at
    }

    spot_claims {
        uuid id PK
        uuid event_id FK "compuesta con user_id"
        uuid event_spot_id FK
        uuid user_id FK "→ event_registrations"
        int points_awarded
        claim_source source
        timestamptz claimed_at
    }

    raffles {
        uuid id PK
        uuid event_id FK
        raffle_status status
        int min_claims
        boolean exclude_staff
    }

    raffle_draws {
        uuid id PK
        uuid raffle_id FK
        uuid user_id FK "ganador"
        text prize_label
        int claims_count
        timestamptz voided_at "anulada"
    }
```

La FK compuesta `spot_claims (event_id, user_id) → event_registrations (event_id, user_id)`
es la que garantiza, **en la base**, que nadie reclame una medalla de un evento al
que no está registrado.
