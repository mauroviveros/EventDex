import { describe, expect, it } from "vitest";
import {
  isValidTimeZone,
  parseEventForm,
  scheduleErrorKey,
} from "./event-form";

const validForm = () => {
  const form = new FormData();
  form.set("title", "Burning Tower Fest");
  form.set("description", "El evento TCG más grande");
  form.set("edition", "2027");
  form.set("timezone", "America/Argentina/Buenos_Aires");
  form.set("location_name", "Lo de Charly");
  form.set("location_address", "Av. Siempreviva 742");
  form.set("location_city", "Springfield");
  form.set("location_state", "Buenos Aires");
  form.set("location_country", "Argentina");
  form.set("start_datetime", "2027-09-12T10:00");
  form.set("end_datetime", "2027-09-12T20:00");
  return form;
};

describe("parseEventForm", () => {
  it("acepta un formulario completo", () => {
    const { values, errors } = parseEventForm(validForm());

    expect(errors).toEqual({});
    expect(values?.title).toBe("Burning Tower Fest");
    expect(values?.location.city).toBe("Springfield");
    expect(values?.schedules).toEqual([
      { start: "2027-09-12T10:00", end: "2027-09-12T20:00" },
    ]);
  });

  it("recorta espacios y normaliza la edición vacía a null", () => {
    const form = validForm();
    form.set("title", "  Con espacios  ");
    form.set("edition", "   ");

    const { values } = parseEventForm(form);
    expect(values?.title).toBe("Con espacios");
    expect(values?.edition).toBeNull();
  });

  it("marca los campos obligatorios que faltan", () => {
    const form = validForm();
    form.set("title", "");
    form.delete("location_city");

    const { values, errors } = parseEventForm(form);
    expect(values).toBeNull();
    expect(errors.title).toBeDefined();
    expect(errors.location_city).toBeDefined();
  });

  it("rechaza un timezone inventado", () => {
    const form = validForm();
    form.set("timezone", "America/Springfield");

    expect(parseEventForm(form).errors.timezone).toBeDefined();
  });

  it("exige que el fin sea posterior al inicio", () => {
    const form = validForm();
    form.set("end_datetime", "2027-09-12T10:00");
    expect(parseEventForm(form).errors[scheduleErrorKey(0)]).toBeDefined();

    form.set("end_datetime", "2027-09-12T09:00");
    expect(parseEventForm(form).errors[scheduleErrorKey(0)]).toBeDefined();
  });

  it("exige la jornada completa", () => {
    const form = validForm();
    form.delete("end_datetime");
    expect(parseEventForm(form).errors[scheduleErrorKey(0)]).toBeDefined();
  });

  it("exige al menos una jornada", () => {
    const form = validForm();
    form.delete("start_datetime");
    form.delete("end_datetime");
    expect(parseEventForm(form).errors.schedule).toBeDefined();
  });
});

describe("parseEventForm con varias jornadas", () => {
  /** Agrega una fila más de jornada, como hace el formulario. */
  const addSchedule = (form: FormData, start: string, end: string) => {
    form.append("start_datetime", start);
    form.append("end_datetime", end);
    return form;
  };

  it("acepta varias jornadas y las ordena por inicio", () => {
    const form = addSchedule(
      addSchedule(validForm(), "2027-09-14T10:00", "2027-09-14T18:00"),
      "2027-09-13T10:00",
      "2027-09-13T18:00",
    );

    const { values, errors } = parseEventForm(form);
    expect(errors).toEqual({});
    expect(values?.schedules.map((schedule) => schedule.start)).toEqual([
      "2027-09-12T10:00",
      "2027-09-13T10:00",
      "2027-09-14T10:00",
    ]);
  });

  it("acepta dos tramos en el mismo día", () => {
    const form = addSchedule(
      validForm(),
      "2027-09-12T21:00",
      "2027-09-12T23:30",
    );

    const { values, errors } = parseEventForm(form);
    expect(errors).toEqual({});
    expect(values?.schedules).toHaveLength(2);
  });

  it("señala la fila exacta que está mal y no las demás", () => {
    const form = addSchedule(
      validForm(),
      "2027-09-13T18:00",
      "2027-09-13T10:00",
    );

    const { values, errors } = parseEventForm(form);
    expect(values).toBeNull();
    expect(errors[scheduleErrorKey(0)]).toBeUndefined();
    expect(errors[scheduleErrorKey(1)]).toBeDefined();
  });
});

describe("isValidTimeZone", () => {
  it("acepta identificadores IANA y rechaza inventados", () => {
    expect(isValidTimeZone("America/Argentina/Buenos_Aires")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });
});
