import { required } from "./env";

/**
 * Config server-only: secretos y parámetros del deployment.
 *
 * NO importar desde componentes cliente. Estas variables no llevan el prefijo
 * `NEXT_PUBLIC_`, así que en el navegador serían `undefined` (Next no las inyecta).
 * Se validan de forma perezosa (getters): cada una falla solo si se accede y no
 * está configurada, con un mensaje claro.
 */
export const serverEnv = {
  get SUPABASE_SERVICE_ROLE_KEY() {
    return required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
  /**
   * Organización dueña del sitio. Es toda la configuración de contenido que
   * necesita el deployment: qué evento mostrar lo decide `getActiveEvent()`
   * según el calendario, no una variable de entorno.
   */
  get EVENTDEX_ORGANIZATION_ID() {
    return required(
      "EVENTDEX_ORGANIZATION_ID",
      process.env.EVENTDEX_ORGANIZATION_ID,
    );
  },
};
