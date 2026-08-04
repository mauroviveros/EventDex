# 02 — Roles y permisos

## El modelo en una frase

La membresía se declara en **dos niveles** (organización y evento) más una
**marca de plataforma** ortogonal a ambos.

```
platform_admins        →  developer | support      (cross-organización)
organization_members   →  owner | staff            (toda la organización)
event_members          →  manager | staff | exhibitor   (un evento puntual)
event_registrations    →  visitante                (un evento puntual)
```

### Por qué no un solo enum de roles

La v1 tenía `ORGANIZATION_MEMBER_ROLE = ADMIN | STAFF | SPOT_OWNER` en una sola
tabla con `event_id` nullable, que significaba "si es null, aplica a toda la
organización". Eso trae tres problemas:

1. **Un rol como `exhibitor` no tiene sentido a nivel organización** — pero el
   modelo lo permitía, y había que recordarlo en el código.
2. **`developer` es cross-organización.** Meterlo en el enum obligaría a crear una
   fila de membresía falsa por cada organización que exista.
3. **Las políticas RLS quedan más simples** cuando "¿tenés acceso a esta
   organización?" y "¿tenés acceso a este evento?" son dos consultas distintas y
   cada una pega a un índice.

Ver [ADR-0004](./adr/0004-modelo-de-roles.md).

## Los cinco actores

### 👤 Visitante (`event_registrations`)

Persona registrada a un evento. No es "miembro" de nada: su relación es con el
evento, no con la organización.

- Se registra al escanear su primer QR (o desde la landing).
- Reclama medallas, ve su perfil y su progreso.
- Participa del sorteo si cumple `raffles.min_claims`.
- **Se registra por evento**, no globalmente: asistir a la Expo 2026 no lo inscribe
  en la Expo 2027.

#### Visitantes nuevos vs. recurrentes

Justamente porque el registro es **por evento**, la tabla responde sola cuánta
gente es nueva y cuánta vuelve. No hace falta guardar nada extra: se deriva de
comparar cada registro con los anteriores del mismo usuario.

Se expone como vista `event_visitor_cohorts`, con dos segmentos:

| Segmento | Definición | Qué te dice |
|----------|-----------|-------------|
| **Nuevo** | Su primer registro a un evento de *esta* organización | Alcance real de la edición: a cuánta gente nueva llegaste |
| **Recurrente** | Ya estuvo en una edición anterior de esta organización | Retención entre ediciones |

Más `previous_org_events`, que dice a cuántas ediciones previas había venido —
con eso salen curvas de fidelidad ("el 12% ya vino a las tres ediciones").

`event_visitor_stats` agrega esos conteos por evento, listo para el dashboard, e
incluye el desglose por `source`: cuántos se registraron escaneando un QR y
cuántos desde la landing antes de llegar al predio.

> **Por qué el corte es por organización y no por plataforma.** "Nuevo en toda
> Eventdex" suena como la métrica obvia, pero no puede vivir en esta vista: la
> vista respeta RLS, así que la window function solo ve los registros de la
> organización que consulta, y el cálculo daría mal. Además, que el staff de un
> cliente sepa que un visitante ya asistió a un evento de **otro** cliente es
> información cross-tenant que no le corresponde. Esa métrica existe, pero como
> `app.platform_visitor_stats()`, restringida al rol developer y pensada para el
> panel de plataforma.

> **Sobre "primer login del evento":** lo que se mide es el primer **registro**,
> no el primer login. Alguien que inicia sesión y mira la landing sin escanear
> nada no genera ninguna fila y es invisible para estas métricas. Es una
> limitación real, y la solución no es la base de datos sino analytics de
> producto (un evento `event_viewed` en Vercel Analytics o similar). Para "cuántos
> visitantes tuve y cuántos eran nuevos", el registro es la medida correcta:
> significa que la persona efectivamente participó.

### 🎪 Expositor (`event_members.role = 'exhibitor'`)

Quien atiende un stand. Existe para que el staff no tenga que cargar los datos de
los 80 stands a mano.

- Edita **solo los spots que tiene asignados** (`event_spot_exhibitors`), y solo
  los campos de presentación: nombre, descripción, avatar.
- No puede crear ni borrar spots, ni cambiar su estado, ni ver métricas de otros.
- Queda **excluido del sorteo** del evento donde atiende.
- ⚠️ **El modelo lo contempla desde el día 1; la interfaz queda para v2.** Las
  tablas y políticas existen, así que habilitarlo después no requiere migración.

### 🛠 Staff (`organization_members.role = 'staff'` o `event_members.role IN ('manager','staff')`)

Miembro operativo. Puede ser de la organización entera o de un evento puntual —
esa es la diferencia entre las dos tablas.

- Crea y edita eventos, jornadas, spots del catálogo y spots del evento.
- Ve todas las métricas y participantes.
- Ejecuta sorteos.
- **No puede borrar** (eventos, spots del catálogo, miembros) ni tocar la
  configuración de la organización. Ese es el límite con el owner.

`manager` vs `staff` a nivel evento: `manager` puede además gestionar los miembros
de ese evento. Es el "staff con llaves" de un evento delegado.

### 👑 Owner (`organization_members.role = 'owner'`)

Dueño de la organización. Todo lo del staff, más:

- **Borrar** (baja lógica) eventos, series, spots y sedes.
- Invitar, cambiar de rol y remover miembros — incluido promover a otro owner.
- Editar la organización: nombre, marca, dominio, zona horaria.
- Ver la facturación de su organización (solo lectura).

Invariante: **una organización no puede quedarse sin owners.** Se hace cumplir con
un trigger, no con la interfaz.

### 🔧 Developer (`platform_admins.level = 'developer'`)

Vos y quien designes. **No es un rol de organización**: es una marca de plataforma,
en una tabla aparte.

- **Lee** todas las organizaciones y todos los eventos (soporte).
- **Escribe únicamente facturación**: crear registros, marcar como pagado, anular.
- **No puede editar contenido de una organización** — ni eventos, ni spots, ni
  miembros. Esa restricción es deliberada: separa "puedo ayudarte a ver qué pasa"
  de "puedo cambiar tus datos", y hace que el acceso cross-org sea defendible.
- Todo lo que hace queda en `audit_logs`.

`support` es el mismo acceso de lectura sin la escritura de facturación, por si
sumás a alguien a atender consultas.

## Matriz de permisos

Leyenda: ✅ permitido · 🔸 limitado (ver nota) · ❌ denegado · — no aplica

### Organización

| Acción | Visitante | Expositor | Staff | Owner | Developer |
|--------|:---------:|:---------:|:-----:|:-----:|:---------:|
| Ver datos públicos de la org | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar nombre / marca / logo | ❌ | ❌ | ❌ | ✅ | ❌ |
| Gestionar dominios | ❌ | ❌ | ❌ | ✅ | ❌ |
| Ver miembros | ❌ | ❌ | ✅ | ✅ | ✅ |
| Invitar / cambiar rol / remover | ❌ | ❌ | ❌ | ✅ | ❌ |
| Eliminar la organización | ❌ | ❌ | ❌ | 🔸¹ | ❌ |

¹ Baja lógica (`deleted_at`), nunca `DELETE` físico.

### Eventos y catálogo

| Acción | Visitante | Expositor | Staff | Owner | Developer |
|--------|:---------:|:---------:|:-----:|:-----:|:---------:|
| Ver evento publicado | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver evento en borrador | ❌ | ❌ | ✅ | ✅ | ✅ |
| Crear evento | ❌ | ❌ | ✅ | ✅ | ❌ |
| Editar evento | ❌ | ❌ | 🔸² | ✅ | ❌ |
| Publicar / despublicar | ❌ | ❌ | ✅ | ✅ | ❌ |
| Republicar como nueva edición | ❌ | ❌ | ✅ | ✅ | ❌ |
| Archivar evento | ❌ | ❌ | ❌ | ✅ | ❌ |
| Eliminar evento | ❌ | ❌ | ❌ | ✅ | ❌ |
| Crear / editar sede | ❌ | ❌ | ✅ | ✅ | ❌ |
| Crear / editar spot del catálogo | ❌ | ❌ | ✅ | ✅ | ❌ |
| Eliminar spot del catálogo | ❌ | ❌ | ❌ | ✅ | ❌ |
| Agregar spot a un evento | ❌ | ❌ | ✅ | ✅ | ❌ |
| Editar spot del evento | ❌ | 🔸³ | ✅ | ✅ | ❌ |
| Activar / desactivar spot del evento | ❌ | ❌ | ✅ | ✅ | ❌ |
| Quitar spot de un evento | ❌ | ❌ | ✅ | ✅ | ❌ |
| Asignar expositor a un spot | ❌ | ❌ | ✅ | ✅ | ❌ |
| Gestionar miembros del evento | ❌ | ❌ | 🔸⁴ | ✅ | ❌ |

² No sobre eventos ya finalizados: son historia y respaldan escaneos que ya ocurrieron.
³ Solo sus spots asignados, solo campos de presentación (`name_override`, `description_override`, `avatar_path_override`).
⁴ Solo `event_members.role = 'manager'`.

### Participación y métricas

| Acción | Visitante | Expositor | Staff | Owner | Developer |
|--------|:---------:|:---------:|:-----:|:-----:|:---------:|
| Registrarse a un evento | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reclamar una medalla | 🔸⁵ | ❌ | ❌ | ❌ | ❌ |
| Ver su propio progreso | ✅ | — | — | — | — |
| Ver el progreso de otros | ❌ | ❌ | ✅ | ✅ | ✅ |
| Ver lista de participantes | ❌ | ❌ | ✅ | ✅ | ✅ |
| Ver métricas del evento | ❌ | 🔸⁶ | ✅ | ✅ | ✅ |
| Bloquear un participante | ❌ | ❌ | ✅ | ✅ | ❌ |
| Configurar el sorteo | ❌ | ❌ | ✅ | ✅ | ❌ |
| Ejecutar una extracción | ❌ | ❌ | ✅ | ✅ | ❌ |
| Anular una extracción | ❌ | ❌ | ✅ | ✅ | ❌ |
| Ver ganadores | ✅ | ✅ | ✅ | ✅ | ✅ |

⁵ Solo si está registrado al evento y el evento está en curso. Un miembro del staff que
además quiera jugar debe registrarse como visitante; queda excluido del sorteo igual.
⁶ Solo el conteo de escaneos de sus propios spots.

### Facturación y soporte

| Acción | Visitante | Expositor | Staff | Owner | Developer |
|--------|:---------:|:---------:|:-----:|:-----:|:---------:|
| Ver facturas de su organización | ❌ | ❌ | ❌ | ✅ | ✅ |
| Ver facturas de todas las orgs | ❌ | ❌ | ❌ | ❌ | ✅ |
| Crear factura | ❌ | ❌ | ❌ | ❌ | ✅ |
| Marcar como pagada | ❌ | ❌ | ❌ | ❌ | ✅ |
| Anular factura | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ver audit log | ❌ | ❌ | ❌ | 🔸⁷ | ✅ |

⁷ Solo el de su organización.

## Exclusión del sorteo

Regla: **queda fuera del sorteo todo el que trabaja en el evento.** Es más amplio
que "quién tiene permisos", porque no es una cuestión de seguridad sino de
limpieza:

```sql
-- Elegible = registrado, activo, con suficientes reclamos, y sin vínculo laboral
-- con el evento ni con la organización.
```

Se excluyen: `organization_members` de la org dueña, `event_members` del evento
(incluidos expositores), y `platform_admins`. Configurable con
`raffles.exclude_staff` por si alguna organización quiere lo contrario.

## Dónde se hace cumplir cada cosa

| Capa | Qué garantiza |
|------|---------------|
| **RLS (Postgres)** | Aislamiento entre organizaciones y visibilidad por rol. Es la barrera real |
| **Constraints / triggers** | Invariantes: un owner mínimo, no reclamar sin registro, no duplicar reclamos |
| **Server actions / endpoints** | Reglas de negocio y transiciones (publicar, sortear, republicar) |
| **Interfaz** | Solo comodidad: no mostrar botones que van a fallar |

La diferencia con la v1 es la primera fila. En v1 el aislamiento entre
organizaciones dependía de que cada query administrativa acordara filtrar por
`organization_id` con la service key. En v2 lo garantiza la base.
