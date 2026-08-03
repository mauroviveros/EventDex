import { cache } from "react";
import { serverEnv } from "@/config/env.server";
import { createServiceClient } from "@/libs/supabase/service";

/**
 * Organización dueña del sitio. Hoy solo aporta el nombre para la metadata,
 * pero es el dato que hace que el título no tenga la marca hardcodeada.
 *
 * Usa la service key porque RLS no expone `organizations` al visitante anónimo
 * (probado: la query con la publishable key devuelve vacío). Es una lectura
 * server-only de un dato público —el nombre que ya se muestra en la página—,
 * así que no filtra nada que el visitante no vea igual.
 */
export const getOrganization = cache(async () => {
  const service = createServiceClient();
  const { data } = await service
    .from("organizations")
    .select("id, name")
    .eq("id", serverEnv.EVENTDEX_ORGANIZATION_ID)
    .maybeSingle();

  return data;
});
