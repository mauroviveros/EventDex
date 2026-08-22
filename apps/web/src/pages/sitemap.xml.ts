import type { APIRoute } from "astro";

export const GET = (async ({ url, locals }) => {
  const { supabase, eventId } = locals;

  // `lastmod` sale del evento: si se editó, el contenido de la home cambió.
  const { data: event } = eventId
    ? await supabase.from("events").select("updated_at, published_at").eq("id", eventId).maybeSingle()
    : { data: null };
  const lastmod = event?.updated_at ?? event?.published_at ?? null;

  const lastmodTag = lastmod
    ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>`
    : "";

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url.origin}/</loc>
    ${lastmodTag}
  </url>
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // 1 hora
    }
  });
}) satisfies APIRoute;
