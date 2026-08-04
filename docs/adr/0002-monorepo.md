# ADR-0002 — Monorepo con Turborepo y pnpm

- **Estado:** Aceptado (2026-08-03)

## Contexto

La pregunta original fue *"¿sigue siendo ideal usar turbo para alojar los distintos
proyectos o un monorepo se podría hacer?"*, lo que sugiere que se están tomando
como alternativas.

**No lo son.** `pnpm-workspace.yaml` es lo que hace el monorepo: define que
`apps/*` y `packages/*` son paquetes de un mismo árbol y se enlazan entre sí.
Turborepo es un **orquestador de tareas** que corre encima: sabe qué depende de
qué, cachea resultados y evita rebuildear lo que no cambió.

La pregunta real es entonces: ¿monorepo o repos separados? Y si es monorepo,
¿hace falta Turbo?

## Decisión

Monorepo con pnpm workspaces, orquestado con Turborepo. Tres apps y seis packages.

```
apps/      web (Astro) · admin (Next) · landing (Astro)
packages/  db · supabase · auth · domain · ui · config
```

## Alternativas consideradas

### Repos separados, tipos publicados como paquete

Aísla deploys y permite versionar el contrato de datos.

Descartada: **un cambio de esquema toca `packages/db` y las tres apps.** En repos
separados eso son tres PRs más un release del paquete de tipos, coordinados a
mano. Para un proyecto de una persona es fricción pura, y el esquema va a cambiar
seguido durante los próximos meses.

### Monorepo sin Turbo (solo pnpm workspaces)

Funciona, y para tres apps no es descabellado.

Descartada porque `turbo run build --filter=...` y `--affected` son exactamente lo
que hace que el CI corra en 40 segundos en vez de 4 minutos cuando tocaste un solo
paquete. Ya está configurado y andando; sacarlo sería trabajo para empeorar.

### Todo en una sola app Next con route groups

Menos deploys, una sola auth.

Descartada porque contradice [ADR-0001](./0001-stack.md): el punto de usar Astro
para lo público es justamente que no comparta bundle con el dashboard.

## Consecuencias

- Un cambio de esquema entra en un commit atómico que atraviesa todo el árbol.
- Caché compartida de builds en local y CI.
- **Regla de dependencia dura:** `packages/domain` no importa Supabase ni React.
  Es lógica pura, testeable sin mocks, y es lo que permite que dos frameworks
  distintos compartan comportamiento.
- Costo: hay que mantener disciplina en el grafo de dependencias. Un package que
  importa "hacia arriba" (un package importando de una app) rompe la caché y no
  lo avisa nadie. Se puede blindar con Turborepo Boundaries.
