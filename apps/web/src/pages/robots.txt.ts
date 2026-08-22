import type { APIRoute } from "astro";

export const GET = (({ url }) => {
  const body = `User-agent: *
Allow: /
Disallow: /auth/
Disallow: /perfil
Disallow: /s/

Sitemap: ${url.origin}/sitemap.xml`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}) satisfies APIRoute;
