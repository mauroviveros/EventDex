"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { createServiceClient } from "@/libs/supabase/service";
import { requireEditableEvent } from "@/server/guard";
import {
  avatarExtension,
  parseSpotForm,
  type SpotFormState,
  validateAvatar,
} from "@/server/spot-form";
import type { Enums } from "@/types";

type Service = ReturnType<typeof createServiceClient>;

/** Vuelta al detalle del evento, directo al tab de stands. */
const spotsTab = (eventId: string) => `/events/${eventId}#spots`;

/**
 * Sube la imagen al bucket público `spot` y devuelve su path, o null si el
 * upload falló. Nunca pisa un archivo existente: cada avatar tiene su propio
 * nombre, así que reemplazar la imagen de un stand no invalida la anterior
 * mientras alguna página la siga sirviendo desde el cache.
 */
async function uploadAvatar(
  service: Service,
  eventId: string,
  file: File,
): Promise<string | null> {
  const extension = avatarExtension(file.type);
  if (!extension) return null;

  // Misma convención que los spots ya cargados: <event_id>/<archivo>.
  const path = `${eventId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await service.storage
    .from("spot")
    .upload(path, file, { contentType: file.type });

  return error ? null : path;
}

/** El input file llega como `File` incluso vacío; `validateAvatar` lo resuelve. */
const avatarFile = (formData: FormData) => {
  const file = formData.get("avatar");
  return file instanceof File ? file : null;
};

/**
 * Confirma que el stand cuelga del evento y sigue vivo. El caller ya validó
 * el evento contra la organización, así que filtrar por `event_id` alcanza
 * para que nadie toque stands ajenos pasando otro `spotId`.
 */
async function findSpot(service: Service, eventId: string, spotId: string) {
  const { data } = await service
    .from("event_spots")
    .select("id, avatar_path")
    .eq("id", spotId)
    .eq("event_id", eventId)
    .is("deleted_at", null)
    .maybeSingle();

  return data;
}

/** Crea un stand del evento. La imagen es obligatoria: es la medalla que se ve. */
export async function createSpot(
  eventId: string,
  _prev: SpotFormState,
  formData: FormData,
): Promise<SpotFormState> {
  const { service } = await requireEditableEvent(eventId);

  const { values, errors } = parseSpotForm(formData);
  const avatar = validateAvatar(avatarFile(formData), true);
  if (avatar.error) errors.avatar = avatar.error;
  if (!values || !avatar.file) return { errors };

  // La imagen va primero: si el insert falla queda un archivo huérfano en el
  // bucket, que es más barato que una fila apuntando a un avatar inexistente.
  const avatarPath = await uploadAvatar(service, eventId, avatar.file);
  if (!avatarPath) {
    return {
      errors: { avatar: "No pudimos subir la imagen. Probá de nuevo." },
    };
  }

  const { error } = await service.from("event_spots").insert({
    event_id: eventId,
    name: values.name,
    description: values.description,
    location: values.location,
    type: values.type,
    avatar_path: avatarPath,
  });

  if (error) {
    await service.storage.from("spot").remove([avatarPath]);
    return { errors: { _form: "No pudimos crear el stand. Probá de nuevo." } };
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  redirect(spotsTab(eventId));
}

/** Guarda los cambios del stand; sin archivo nuevo conserva el avatar actual. */
export async function updateSpot(
  eventId: string,
  spotId: string,
  _prev: SpotFormState,
  formData: FormData,
): Promise<SpotFormState> {
  const { service } = await requireEditableEvent(eventId);

  const spot = await findSpot(service, eventId, spotId);
  if (!spot) redirect(spotsTab(eventId));

  const { values, errors } = parseSpotForm(formData);
  const avatar = validateAvatar(avatarFile(formData), false);
  if (avatar.error) errors.avatar = avatar.error;
  if (!values || avatar.error) return { errors };

  let avatarPath = spot.avatar_path;
  if (avatar.file) {
    const uploaded = await uploadAvatar(service, eventId, avatar.file);
    if (!uploaded) {
      return {
        errors: { avatar: "No pudimos subir la imagen. Probá de nuevo." },
      };
    }
    avatarPath = uploaded;
  }

  const { error } = await service
    .from("event_spots")
    .update({
      name: values.name,
      description: values.description,
      location: values.location,
      type: values.type,
      avatar_path: avatarPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", spotId);

  if (error) {
    return { errors: { _form: "No pudimos guardar los cambios." } };
  }

  // Limpieza best-effort del avatar anterior: ya no lo referencia nadie.
  if (avatarPath !== spot.avatar_path) {
    await service.storage.from("spot").remove([spot.avatar_path]);
  }

  revalidatePath(`/events/${eventId}`);
  redirect(spotsTab(eventId));
}

/**
 * Baja lógica del stand: desaparece del dashboard y deja de entregar medallas,
 * pero la fila queda porque `user_spot_history` la referencia. La imagen no se
 * borra del bucket: sin ella, revertir la baja dejaría el stand sin medalla.
 */
export async function deleteSpot(eventId: string, spotId: string) {
  const { service } = await requireEditableEvent(eventId);

  const spot = await findSpot(service, eventId, spotId);
  if (!spot) redirect(spotsTab(eventId));

  await service
    .from("event_spots")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", spotId);

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  redirect(spotsTab(eventId));
}

/** Activa o desactiva un stand: deja de entregar medallas sin darlo de baja. */
export async function setSpotStatus(
  eventId: string,
  spotId: string,
  status: Enums<"SPOT_STATUS">,
) {
  const { service } = await requireEditableEvent(eventId);

  const spot = await findSpot(service, eventId, spotId);
  if (!spot) return;

  await service
    .from("event_spots")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", spotId);

  revalidatePath(`/events/${eventId}`);
}
