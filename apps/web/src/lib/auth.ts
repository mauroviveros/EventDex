/**
 * Proveedores habilitados.
 *
 * Google para los visitantes,
 * GitHub para la cuenta de desarrollo.
 */
const PROVIDERS = ["google", "github"] as const;
export type AuthProvider = (typeof PROVIDERS)[number];

/**
 * El proveedor llega de un formulario, o sea del cliente. Sin esta lista blanca
 * se le estaría pasando a `signInWithOAuth` lo que mande cualquiera.
 */
export function isAuthProvider(value: unknown): value is AuthProvider {
  return typeof value === "string" && (PROVIDERS as readonly string[]).includes(value);
}

/**
 * Sanea el `next` de una redirección post-login.
 *
 * Sin esto es un **open redirect**: `?next=https://sitio-falso.com` mandaría al
 * visitante a otro dominio justo después de autenticarse, que es el momento
 * ideal para una pantalla de phishing.
 *
 * Solo se aceptan rutas de este sitio. Se rechazan las protocolo-relativas
 * (`//otro.com`) y la variante con backslash (`/\otro.com`), que varios
 * navegadores normalizan a `//`.
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}
