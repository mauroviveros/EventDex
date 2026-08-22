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

/**
 * Motivos de fallo de login, con su mensaje.
 *
 * Vive acá y no en la página de error porque el contrato está partido: quien
 * PRODUCE el motivo son las rutas de `/auth`, y quien lo CONSUME es la página.
 * Con los strings sueltos en tres archivos, un `?reason=exchanges` mal escrito
 * no rompe nada — el visitante ve el mensaje genérico y nadie se entera.
 *
 * `access_denied` y `server_error` los manda el proveedor OAuth, no nosotros:
 * están para poder traducirlos, pero la búsqueda necesita fallback igual porque
 * el proveedor puede devolver cualquier código.
 */
export const AUTH_ERROR_REASONS = {
  provider: "Ese proveedor de ingreso no está habilitado.",
  oauth: "No pudimos contactar al proveedor. Probá de nuevo en un momento.",
  "missing-code": "El proveedor no devolvió un código de autorización.",
  exchange: "No pudimos intercambiar el código por un token de acceso.",
  access_denied: "El proveedor denegó el acceso.",
  server_error: "Ocurrió un error en el servidor. Probá de nuevo en un momento.",
} as const;

export type AuthErrorReason = keyof typeof AUTH_ERROR_REASONS;

/**
 * Ruta de la página de error para un motivo conocido.
 *
 * El tipo del parámetro es lo que convierte un typo en el redirect en un error
 * de compilación en vez de un mensaje genérico en producción.
 */
export function authErrorPath(reason: AuthErrorReason): string {
  return `/auth/error?reason=${reason}`;
}

/**
 * Mensaje para un motivo que llega por query string.
 *
 * El `reason` es texto del cliente: se usa SOLO como clave de búsqueda, nunca
 * se renderiza crudo. Así `?reason=Tu cuenta fue bloqueada, llamá al 0800...`
 * cae al mensaje genérico en vez de imprimirse como si fuera nuestro.
 */
export function authErrorMessage(raw: string | null | undefined): string {
  if (raw && raw in AUTH_ERROR_REASONS) {
    return AUTH_ERROR_REASONS[raw as AuthErrorReason];
  }
  return "No pudimos completar el ingreso.";
}
