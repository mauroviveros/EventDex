import { safeNext } from "@/lib/auth";
import type { APIRoute } from "astro";

/**
 * Cierra la sesión.
 *
 * POST y no GET a propósito: un GET que cierra sesión lo dispara cualquier
 * `<img src="/auth/signout">` en una página de terceros, o el prefetch del
 * navegador.
 */
export const POST = (async ({ request, locals, redirect }) => {
    const form = await request.formData();
    const next = safeNext(form.get("next")?.toString());

    await locals.supabase.auth.signOut();

    return redirect(next, 303);
}) satisfies APIRoute;
