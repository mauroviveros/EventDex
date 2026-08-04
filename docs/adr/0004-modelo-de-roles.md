# ADR-0004 — Modelo de roles en tres niveles

- **Estado:** Aceptado (2026-08-03)

## Contexto

La v1 tiene un solo enum, `ORGANIZATION_MEMBER_ROLE = ADMIN | STAFF | SPOT_OWNER`,
en una sola tabla `organization_members` con una columna `event_id` nullable que
significa *"si es null, el rol aplica a toda la organización"*.

Los requisitos nuevos son cinco actores:

- **Usuario**: visitante registrado a un evento.
- **Staff**: miembro administrador de la organización **o de un evento en
  específico**.
- **Owner**: dueño de la organización, última palabra (por ejemplo, borrar).
- **Un cuarto rol sin nombre**: administra los datos de un spot propio, para que
  el staff no cargue todo. Puede tener varios spots, quizás en varias orgs.
- **Developer**: identificación cross-organización para soporte y facturación.
  *"Quizás ni sería un rol."*

## Decisión

Tres niveles separados, más el registro del visitante:

```
platform_admins        developer | support          cross-organización
organization_members   owner | staff                toda la organización
event_members          manager | staff | exhibitor  un evento
event_registrations    (visitante)                  un evento
```

### El cuarto rol se llama `exhibitor`

La intuición de *"algún SPOT_OWNER o algo así"* es correcta en el concepto pero
problemática en el nombre: **`owner` en este modelo ya significa dueño de la
organización**, que es el rol con más poder de todos. Tener `owner` y `spot_owner`
conviviendo hace que un vistazo rápido a una política RLS o a un `if` sea
ambiguo — y es el tipo de ambigüedad que produce bugs de permisos.

`exhibitor` (expositor) es el término de industria para quien atiende un stand en
una expo, y no colisiona con nada.

| Descartado | Por qué |
|------------|---------|
| `spot_owner` | Colisiona visualmente con `owner` |
| `vendor` | Implica venta; un spot puede ser una atracción |
| `host` | Ambiguo con "anfitrión del evento" |
| `stand_manager` | Largo, y no aplica a atracciones |

### `developer` no es un rol de organización

La intuición de *"quizás ni sería un rol, sino una manera de identificarme"* es
exactamente correcta, y el modelo la sigue: `platform_admins` es una tabla aparte.

Meter `developer` en `organization_role` obligaría a crear una fila de membresía
falsa por cada organización que exista en la plataforma. Con una tabla propia:

- Se otorga una vez y aplica a todo.
- Auditar quién tiene acceso total es `select * from platform_admins`.
- El permiso es asimétrico y eso se puede expresar: **lee todo, escribe solo
  facturación**. Ningún rol de organización tiene esa forma.

### Por qué separar organización de evento

Mantener el `event_id` nullable de v1 tenía tres problemas:

1. **`exhibitor` no tiene sentido a nivel organización**, pero el modelo lo
   permitía y había que recordarlo en el código.
2. Las políticas RLS quedan más simples cuando "¿tenés acceso a esta
   organización?" y "¿tenés acceso a este evento?" son dos consultas distintas,
   cada una pegando a su propio índice, en vez de una con `OR` y `IS NULL`.
3. La unicidad es distinta: `(organization_id, user_id)` en un caso,
   `(event_id, user_id)` en el otro. Con una sola tabla no se puede expresar
   ninguna de las dos limpiamente.

`manager` vs `staff` a nivel evento: `manager` puede además gestionar el equipo de
ese evento. Es el "staff con llaves" de un evento delegado a un tercero.

## Consecuencias

### Positivas

- Cada nivel se consulta con un índice simple.
- Habilitar el panel del expositor más adelante no requiere migración: las tablas
  y políticas ya existen.
- El acceso cross-org está aislado y es auditable.
- El visitante deja de ser implícito (ver
  [03](../03-modelo-de-datos.md#event_registrations)).

### Negativas

- **Tres tablas de membresía en vez de una.** Resolver "qué puede hacer este
  usuario acá" toca hasta tres tablas. Se mitiga con los helpers `app.*`
  documentados en [04](../04-rls.md), que encapsulan la pregunta.
- Un usuario puede ser `staff` de la organización **y** `exhibitor` de un evento.
  Regla: **gana el permiso más alto**. Los helpers lo resuelven; no hay que
  pensarlo en cada consulta.
