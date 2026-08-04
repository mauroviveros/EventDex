# Eventdex v2 — Documentación de diseño

Esta carpeta es el punto de partida del rediseño. Se escribió **antes** que el código
a propósito: primero cerramos modelo de datos, roles y permisos; recién después
levantamos las apps.

## Orden de lectura

| # | Documento | Qué responde |
|---|-----------|--------------|
| 00 | [Visión y glosario](./00-vision.md) | Qué es Eventdex, quién es cada actor, vocabulario único |
| 01 | [Arquitectura](./01-arquitectura.md) | Stack elegido, topología del monorepo, tradeoffs |
| 02 | [Roles y permisos](./02-roles-y-permisos.md) | Los 5 actores, la matriz de permisos completa |
| 03 | [Modelo de datos](./03-modelo-de-datos.md) | Tablas, columnas, relaciones, y el porqué de cada cambio |
| 04 | [RLS](./04-rls.md) | Política por tabla y por rol, helpers SQL, performance |
| 05 | [Flujos](./05-flujos.md) | Circuitos completos: QR, registro, publicación, sorteo, dominio |
| 06 | [Roadmap](./06-roadmap.md) | Fases con checklist, qué entra en v1 y qué no |

Complementos:

- [`erd.md`](./erd.md) — diagrama entidad-relación (Mermaid, se renderiza en GitHub)
- [`adr/`](./adr/) — Architecture Decision Records: la decisión, las alternativas y por qué se descartaron
- [`sql/`](./sql/) — migraciones del esquema nuevo, numeradas y en orden de aplicación

## Cómo usar esto

1. Leé 00 → 03 de corrido. Si algo del modelo de datos no te cierra, ese es el momento
   de discutirlo: cambiar una tabla en este markdown cuesta cero, cambiarla con datos
   productivos cuesta una migración.
2. Los `sql/` son ejecutables tal cual sobre un proyecto Supabase limpio.
3. El roadmap (06) es el que dice en qué orden se escribe el código.

## Estado

| Bloque | Estado |
|--------|--------|
| Stack y topología | ✅ Decidido |
| Modelo de datos | 📝 Propuesto — pendiente tu revisión |
| RLS | 📝 Propuesto — pendiente tu revisión |
| Migración de datos de v1 | ✅ Descartada — se arranca con Supabase limpio |
| Código de las apps | ⛔ No empezado |
