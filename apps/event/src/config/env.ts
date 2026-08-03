/**
 * Variables de entorno públicas: se exponen al bundle del cliente.
 *
 * Se referencian como `process.env.NEXT_PUBLIC_*` de forma estática (no dinámica)
 * a propósito: Next.js reemplaza estas expresiones por su valor literal en tiempo
 * de build, y solo lo hace cuando el acceso es estático.
 */

export function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  get SUPABASE_URL() {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get SUPABASE_PUBLISHABLE_KEY() {
    return required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  },
  /**
   * URL del dashboard de organizadores. Opcional a propósito: si no está
   * configurada el menú simplemente no ofrece el acceso, en vez de romper la
   * app pública por una variable que solo le sirve a un puñado de usuarios.
   */
  get DASHBOARD_URL(): string | null {
    return process.env.NEXT_PUBLIC_DASHBOARD_URL || null;
  },
};
