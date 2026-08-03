import { describe, expect, it } from "vitest";
import {
  AVATAR_MAX_BYTES,
  avatarExtension,
  parseSpotForm,
  validateAvatar,
} from "./spot-form";

const validForm = () => {
  const form = new FormData();
  form.set("name", "Lo de Charly");
  form.set("description", "Cartas, dados y sobres");
  form.set("location", "Pabellón A");
  form.set("type", "LOCAL");
  return form;
};

/** File con el tamaño pedido, sin materializar los bytes uno por uno. */
const file = (type: string, size = 1024) =>
  new File([new Uint8Array(size)], "avatar", { type });

describe("parseSpotForm", () => {
  it("acepta un formulario completo", () => {
    const { values, errors } = parseSpotForm(validForm());

    expect(errors).toEqual({});
    expect(values).toEqual({
      name: "Lo de Charly",
      description: "Cartas, dados y sobres",
      location: "Pabellón A",
      type: "LOCAL",
    });
  });

  it("recorta espacios", () => {
    const form = validForm();
    form.set("name", "  Con espacios  ");

    expect(parseSpotForm(form).values?.name).toBe("Con espacios");
  });

  it("acepta la ubicación vacía", () => {
    const form = validForm();
    form.delete("location");

    const { values, errors } = parseSpotForm(form);
    expect(errors).toEqual({});
    expect(values?.location).toBe("");
  });

  it("marca los campos obligatorios que faltan", () => {
    const form = validForm();
    form.set("name", "   ");
    form.delete("description");

    const { values, errors } = parseSpotForm(form);
    expect(values).toBeNull();
    expect(errors.name).toBeDefined();
    expect(errors.description).toBeDefined();
  });

  it("rechaza un tipo que no es del enum", () => {
    const form = validForm();
    form.set("type", "FOOD_TRUCK");

    const { values, errors } = parseSpotForm(form);
    expect(values).toBeNull();
    expect(errors.type).toBeDefined();
  });
});

describe("validateAvatar", () => {
  it("exige imagen en el alta y no en la edición", () => {
    expect(validateAvatar(null, true).error).toBeDefined();
    expect(validateAvatar(null, false)).toEqual({ file: null, error: null });
  });

  it("trata un input sin archivo (0 bytes) como vacío", () => {
    expect(
      validateAvatar(file("application/octet-stream", 0), true).error,
    ).toBeDefined();
    expect(validateAvatar(file("application/octet-stream", 0), false)).toEqual({
      file: null,
      error: null,
    });
  });

  it("acepta los formatos soportados", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      expect(validateAvatar(file(type), true).error).toBeNull();
    }
  });

  it("rechaza formatos no soportados", () => {
    expect(validateAvatar(file("image/gif"), true).error).toBeDefined();
    expect(validateAvatar(file("application/pdf"), true).error).toBeDefined();
  });

  it("rechaza imágenes que superan el máximo", () => {
    expect(
      validateAvatar(file("image/png", AVATAR_MAX_BYTES), true).error,
    ).toBeNull();
    expect(
      validateAvatar(file("image/png", AVATAR_MAX_BYTES + 1), true).error,
    ).toBeDefined();
  });
});

describe("avatarExtension", () => {
  it("mapea el mime type a la extensión del bucket", () => {
    expect(avatarExtension("image/jpeg")).toBe("jpg");
    expect(avatarExtension("image/png")).toBe("png");
    expect(avatarExtension("image/gif")).toBeNull();
  });
});
