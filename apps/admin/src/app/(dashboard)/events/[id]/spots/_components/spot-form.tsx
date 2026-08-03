"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AVATAR_ACCEPT, type SpotFormState } from "@/server/spot-form";
import type { Enums } from "@/types";
import { initials } from "@/utils";

const TYPES: { value: Enums<"SPOT_TYPE">; label: string }[] = [
  { value: "LOCAL", label: "Local" },
  { value: "ATTRACTION", label: "Atracción" },
];

/**
 * El asterisco es decorativo: el campo ya lleva `required`, que es lo que
 * anuncian los lectores de pantalla.
 */
function RequiredLabel({
  htmlFor,
  children,
}: Readonly<{ htmlFor: string; children: React.ReactNode }>) {
  return (
    <FieldLabel htmlFor={htmlFor}>
      {children}
      <span aria-hidden className="text-destructive">
        *
      </span>
    </FieldLabel>
  );
}

/** Valores para precargar el formulario. */
export type SpotFormDefaults = {
  name: string;
  description: string;
  location: string;
  type: Enums<"SPOT_TYPE"> | null;
  /** Avatar ya cargado; su presencia es lo que distingue edición de alta. */
  avatarUrl: string;
};

/**
 * Vista previa de la medalla: la imagen elegida, o la actual mientras no se
 * elija ninguna. El object URL se revoca al cambiar de archivo o al
 * desmontar; si no, cada selección deja un blob retenido hasta recargar.
 */
function AvatarPreview({
  file,
  current,
  name,
}: Readonly<{ file: File | null; current?: string; name: string }>) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const src = preview ?? current;

  return (
    <Avatar className="size-20 rounded-lg after:rounded-lg">
      <AvatarImage src={src} alt="" className="rounded-lg" />
      <AvatarFallback className="rounded-lg">
        {initials(name) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

type SpotFormProps = Readonly<{
  action: (prev: SpotFormState, formData: FormData) => Promise<SpotFormState>;
  defaults?: SpotFormDefaults;
  submitLabel: string;
  cancelHref: string;
}>;

/** Formulario de stand, compartido por el alta y la edición. */
export function SpotForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
}: SpotFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const errors = state?.errors ?? {};

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState(defaults?.name ?? "");
  const isEdit = Boolean(defaults?.avatarUrl);

  return (
    <form action={formAction} className="flex max-w-6xl flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Los campos con <span className="text-destructive">*</span> son
        obligatorios.
      </p>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del stand</CardTitle>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.name)}>
                <RequiredLabel htmlFor="name">Nombre</RequiredLabel>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.description)}>
                <RequiredLabel htmlFor="description">Descripción</RequiredLabel>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={defaults?.description}
                  rows={3}
                  required
                />
                <FieldDescription>
                  Es lo que lee el visitante al escanear el QR.
                </FieldDescription>
                <FieldError>{errors.description}</FieldError>
              </Field>

              <div className="grid gap-7 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="location">
                    Ubicación en el predio
                  </FieldLabel>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={defaults?.location}
                    placeholder="Pabellón A, stand 12"
                  />
                </Field>

                <Field data-invalid={Boolean(errors.type)}>
                  <RequiredLabel htmlFor="type">Tipo</RequiredLabel>
                  <Select name="type" defaultValue={defaults?.type ?? "LOCAL"}>
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.type}</FieldError>
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Medalla
              {!isEdit && (
                <span aria-hidden className="text-destructive">
                  *
                </span>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <AvatarPreview
                file={file}
                current={defaults?.avatarUrl}
                name={name}
              />

              <Field className="flex-1" data-invalid={Boolean(errors.avatar)}>
                <FieldLabel htmlFor="avatar">
                  {isEdit ? "Reemplazar imagen" : "Imagen"}
                </FieldLabel>
                <Input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept={AVATAR_ACCEPT}
                  required={!isEdit}
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <FieldDescription>
                  PNG, JPG o WebP, hasta 2 MB.
                  {isEdit && " Si no elegís una, se conserva la actual."}
                </FieldDescription>
                <FieldError>{errors.avatar}</FieldError>
              </Field>
            </div>
          </CardContent>
        </Card>
      </div>

      <FieldError>{errors._form}</FieldError>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </Button>

        <Button type="button" variant="ghost" asChild>
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
