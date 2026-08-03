/**
 * Parseo y validación del formulario de stands. Sin I/O, igual que
 * `event-form`: las reglas se pueden testear solas y la Server Action se
 * encarga de subir la imagen y escribir.
 */

import type { Enums } from "@/types";

export type SpotFormValues = {
  name: string;
  description: string;
  /** Dónde está el stand dentro del predio ("Pabellón A", "Stand 12"). */
  location: string;
  type: Enums<"SPOT_TYPE">;
};

/** Errores por campo; `_form` es el que no pertenece a ninguno. */
export type SpotFormErrors = Record<string, string>;

/** Lo que devuelven las actions del formulario a `useActionState`. */
export type SpotFormState = { errors: SpotFormErrors } | null;

const TYPES: Enums<"SPOT_TYPE">[] = ["LOCAL", "ATTRACTION"];

const isSpotType = (value: string): value is Enums<"SPOT_TYPE"> =>
  TYPES.includes(value as Enums<"SPOT_TYPE">);

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};

export function parseSpotForm(formData: FormData): {
  values: SpotFormValues | null;
  errors: SpotFormErrors;
} {
  const errors: SpotFormErrors = {};

  const name = text(formData, "name");
  const description = text(formData, "description");
  const type = text(formData, "type");

  if (!name) errors.name = "El nombre es obligatorio.";
  if (!description) errors.description = "La descripción es obligatoria.";
  if (!isSpotType(type)) errors.type = "Elegí un tipo de stand.";

  if (Object.keys(errors).length > 0) return { values: null, errors };

  return {
    values: {
      name,
      description,
      // La columna es NOT NULL sin default: vacío se guarda como "".
      location: text(formData, "location"),
      type: type as Enums<"SPOT_TYPE">,
    },
    errors,
  };
}

/** Tipos de imagen aceptados para el avatar y su extensión en el bucket. */
const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Valor del `accept` del input: los mismos tipos que valida el servidor. */
export const AVATAR_ACCEPT = Object.keys(AVATAR_EXTENSIONS).join(",");

/** Extensión para el mime type del avatar, o null si no es un tipo aceptado. */
export function avatarExtension(mimeType: string): string | null {
  return AVATAR_EXTENSIONS[mimeType] ?? null;
}

/**
 * Valida el archivo del avatar. `required` distingue el alta (hay que subir
 * una imagen) de la edición (sin archivo se conserva la actual, así que un
 * input vacío no es un error).
 *
 * Un input file sin elegir archivo llega igual como `File` de 0 bytes: por eso
 * "vacío" se mide por tamaño y no por ausencia.
 */
export function validateAvatar(
  file: File | null,
  required: boolean,
): { file: File | null; error: string | null } {
  if (!file || file.size === 0) {
    return required
      ? { file: null, error: "Subí una imagen para el stand." }
      : { file: null, error: null };
  }
  if (!avatarExtension(file.type)) {
    return { file: null, error: "Formato no soportado (PNG, JPG o WebP)." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { file: null, error: "La imagen no puede superar los 2 MB." };
  }

  return { file, error: null };
}
