"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
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
import { scheduleErrorKey } from "@/server/event-form";
import { createEvent } from "../../actions";

/** Zonas frecuentes; la lista corta evita un selector de 400 opciones. */
const TIMEZONES = [
  "America/Argentina/Buenos_Aires",
  "America/Montevideo",
  "America/Santiago",
  "America/Asuncion",
  "America/Sao_Paulo",
  "America/La_Paz",
  "America/Lima",
  "America/Bogota",
  "America/Mexico_City",
  "America/New_York",
  "Europe/Madrid",
  "UTC",
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

export function NewEventForm() {
  const [state, formAction, pending] = useActionState(createEvent, null);
  const errors = state?.errors ?? {};

  // Las filas se identifican por id y no por posición: al borrar una del medio,
  // React tiene que descartar ese input y no reordenar los valores tipeados.
  const [rows, setRows] = useState([0]);
  const nextRow = useRef(1);

  const addRow = () => setRows((current) => [...current, nextRow.current++]);
  const removeRow = (id: number) =>
    setRows((current) => current.filter((row) => row !== id));

  return (
    <form action={formAction} className="flex max-w-6xl flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Los campos con <span className="text-destructive">*</span> son
        obligatorios.
      </p>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del evento</CardTitle>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.title)}>
                <RequiredLabel htmlFor="title">Título</RequiredLabel>
                <Input id="title" name="title" required />
                <FieldError>{errors.title}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.description)}>
                <RequiredLabel htmlFor="description">Descripción</RequiredLabel>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  required
                />
                <FieldError>{errors.description}</FieldError>
              </Field>

              <div className="grid gap-7 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edition">Edición</FieldLabel>
                  <Input id="edition" name="edition" placeholder="2027" />
                </Field>

                <Field data-invalid={Boolean(errors.timezone)}>
                  <RequiredLabel htmlFor="timezone">Zona horaria</RequiredLabel>
                  <Select name="timezone" defaultValue={TIMEZONES[0]}>
                    <SelectTrigger id="timezone" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.timezone}</FieldError>
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.location_name)}>
                <RequiredLabel htmlFor="location_name">
                  Nombre del lugar
                </RequiredLabel>
                <Input id="location_name" name="location_name" required />
                <FieldError>{errors.location_name}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.location_address)}>
                <RequiredLabel htmlFor="location_address">
                  Dirección
                </RequiredLabel>
                <Input id="location_address" name="location_address" required />
                <FieldError>{errors.location_address}</FieldError>
              </Field>

              <div className="grid gap-7 sm:grid-cols-3">
                <Field data-invalid={Boolean(errors.location_city)}>
                  <RequiredLabel htmlFor="location_city">Ciudad</RequiredLabel>
                  <Input id="location_city" name="location_city" required />
                  <FieldError>{errors.location_city}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.location_state)}>
                  <RequiredLabel htmlFor="location_state">
                    Provincia
                  </RequiredLabel>
                  <Input id="location_state" name="location_state" required />
                  <FieldError>{errors.location_state}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.location_country)}>
                  <RequiredLabel htmlFor="location_country">País</RequiredLabel>
                  <Input
                    id="location_country"
                    name="location_country"
                    defaultValue="Argentina"
                    required
                  />
                  <FieldError>{errors.location_country}</FieldError>
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Jornadas
            <span aria-hidden className="text-destructive">
              *
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Un evento puede tener varias: días distintos, o dos tramos del mismo
            día. Los horarios son los del lugar del evento, no los de tu
            computadora.
          </p>

          {/* Dos jornadas por fila cuando entra, para no dejar la tarjeta vacía. */}
          <div className="grid gap-3 2xl:grid-cols-2">
            {rows.map((row, index) => (
              <div key={row} className="flex flex-col gap-2">
                {/*
                  `flex-wrap` con ancho mínimo: los inputs datetime-local no
                  achican por debajo de su ancho intrínseco, así que en pantallas
                  angostas tienen que pasar a la línea siguiente en vez de
                  desbordar la tarjeta.
                */}
                <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
                  <Field
                    className="min-w-44 flex-1"
                    data-invalid={Boolean(errors[scheduleErrorKey(index)])}
                  >
                    <FieldLabel htmlFor={`start-${row}`}>Inicio</FieldLabel>
                    <Input
                      id={`start-${row}`}
                      name="start_datetime"
                      type="datetime-local"
                      required
                    />
                  </Field>

                  <Field
                    className="min-w-44 flex-1"
                    data-invalid={Boolean(errors[scheduleErrorKey(index)])}
                  >
                    <FieldLabel htmlFor={`end-${row}`}>Fin</FieldLabel>
                    <Input
                      id={`end-${row}`}
                      name="end_datetime"
                      type="datetime-local"
                      required
                    />
                  </Field>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar jornada ${index + 1}`}
                    disabled={rows.length === 1}
                    onClick={() => removeRow(row)}
                  >
                    <Trash2 />
                  </Button>
                </div>

                <FieldError>{errors[scheduleErrorKey(index)]}</FieldError>
              </div>
            ))}
          </div>

          <div>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus />
              Agregar jornada
            </Button>
          </div>

          <FieldError>{errors.schedule}</FieldError>
        </CardContent>
      </Card>

      <FieldError>{errors._form}</FieldError>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear evento"}
        </Button>

        <Button type="button" variant="ghost" asChild>
          <Link href="/events">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
