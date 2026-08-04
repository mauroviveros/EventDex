# ADR-0003 — Spots reutilizables: catálogo + relación con snapshot

- **Estado:** Aceptado (2026-08-03)

## Contexto

En v1, `event_spots.event_id` es obligatorio: un spot **es** de un evento. Eso
significa que la edición 2027 de una expo obliga a recargar a mano los 80 stands
que ya existían en 2026, con sus nombres, descripciones y avatares.

El planteo original fue: *"poder crear spots sin atarlo a eventos, para que se
puedan reutilizar — aunque quizás crear una copia podría ser más óptimo, y después
en la relación ahí sí tener info de la relación, como si está activado o no"*.

Esa intuición es correcta, y la duda entre "referencia" y "copia" tiene una
respuesta que no es ninguna de las dos por separado.

## El problema de cada opción pura

### Referencia pura

`event_spots` apunta a `spots` y siempre lee el nombre de ahí.

- ✅ Editás el catálogo una vez y se propaga a todos los eventos.
- ❌ **Reescribe la historia.** Si en 2027 renombrás "Café Ubbe" a "Ubbe Coffee",
  el reporte de la Expo 2026 pasa a decir "Ubbe Coffee". Un stand que cambió de
  dueño entre ediciones borra retroactivamente al anterior.

### Copia pura

Al agregar un spot a un evento se duplican todos sus datos.

- ✅ El histórico es inmutable.
- ❌ Se pierde la ventaja de reutilizar: corregir un typo en el catálogo no
  arregla los eventos que todavía no arrancaron. Y el catálogo queda sin sentido:
  es solo una plantilla de la que nadie depende.

## Decisión

**Las dos cosas, en momentos distintos del ciclo de vida del evento.**

```
evento en draft / upcoming   →  referencia viva al catálogo
publish_event()              →  congela `snapshot`
evento published en adelante →  lee del snapshot
```

Más una capa de **overrides** para el caso "en esta edición se llama distinto",
que es independiente de lo anterior.

Regla de resolución (vista `event_spots_resolved` y `packages/domain`):

```
nombre efectivo = name_override            -- override explícito de esta edición
               ?? snapshot->>'name'        -- congelado al publicar
               ?? spots.name               -- referencia viva
```

### Estructura

| Tabla | Rol |
|-------|-----|
| `spots` | Catálogo de la organización. Existe sin evento |
| `event_spots` | La relación. Lleva `code`, `booth`, `status`, `points`, `sort_order`, los `*_override` y el `snapshot` |

## Alternativas consideradas

### `spot_id` nullable, permitiendo spots "solo de evento"

Descartada. Introduce dos clases de spot y obliga a que cada query contemple las
dos. La uniformidad vale más: **todo spot nace en el catálogo**, aunque el usuario
no se entere. El formulario "crear spot nuevo" del evento crea las dos filas en la
misma transacción, y para el usuario es un solo paso.

### Versionado del catálogo (`spot_versions`)

Cada edición de un spot crea una versión; `event_spots` apunta a una versión.

Descartada por complejidad: es el modelo correcto para un CMS con historial
completo, pero acá el único momento en que la historia importa es la publicación
del evento. Un `snapshot jsonb` cubre el caso con una fracción del costo.

## Consecuencias

### Positivas

- Republicar un evento es `duplicate_event()`, no recargar 80 stands.
- Los reportes históricos son estables.
- El estado activo/inactivo, el código del QR y el puesto son de la relación, que
  es donde corresponde: el mismo stand puede estar en A12 un año y en B03 el
  siguiente.
- `ON DELETE RESTRICT` sobre `spot_id` protege el catálogo: no se puede borrar un
  spot usado en algún evento, se archiva.

### Negativas

- **Hay una regla de resolución que hay que respetar en todos lados.** Se mitiga
  con la vista `event_spots_resolved` y una función en `packages/domain`; la regla
  se implementa dos veces y nunca más.
- El `snapshot` duplica datos. Es intencional y acotado: tres campos por spot por
  evento.
- Hay que acordarse de congelar en `publish_event()`. Si se olvida, el
  comportamiento degrada a referencia viva — falla suave, no rompe nada.
