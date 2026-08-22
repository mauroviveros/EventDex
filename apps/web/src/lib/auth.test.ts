import { describe, expect, it } from "vitest";
import { authErrorMessage, isAuthProvider, safeNext } from "./auth";

describe("safeNext", () => {
  it("acepta rutas de este sitio", () => {
    expect(safeNext("/perfil")).toBe("/perfil");
    expect(safeNext("/s/abc?x=1")).toBe("/s/abc?x=1");
  });

  it("cae a la home sin valor", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext(undefined)).toBe("/");
    expect(safeNext("")).toBe("/");
  });

  it("rechaza URLs absolutas", () => {
    // El ataque directo: mandar al visitante a otro dominio justo después de
    // autenticarse, que es cuando más confía en lo que ve.
    expect(safeNext("https://sitio-falso.com")).toBe("/");
    expect(safeNext("http://sitio-falso.com")).toBe("/");
  });

  it("rechaza protocolo-relativas", () => {
    // `//otro.com` empieza con "/" y parece una ruta, pero el navegador la
    // resuelve como `https://otro.com`. Es el bypass clásico de un chequeo
    // que solo mira el primer carácter.
    expect(safeNext("//sitio-falso.com")).toBe("/");
  });

  it("rechaza la variante con backslash", () => {
    // Varios navegadores normalizan `/\` a `//`, así que es el mismo ataque
    // esquivando un chequeo que solo busca "//".
    expect(safeNext("/\\sitio-falso.com")).toBe("/");
  });
});

describe("isAuthProvider", () => {
  it("acepta los habilitados", () => {
    expect(isAuthProvider("google")).toBe(true);
    expect(isAuthProvider("github")).toBe(true);
  });

  it("rechaza cualquier otra cosa", () => {
    // Llega de un formulario: sin la lista blanca se le pasaría a
    // `signInWithOAuth` lo que mande quien sea.
    expect(isAuthProvider("facebook")).toBe(false);
    expect(isAuthProvider("")).toBe(false);
    expect(isAuthProvider(null)).toBe(false);
    expect(isAuthProvider(42)).toBe(false);
  });
});

describe("authErrorMessage", () => {
  it("traduce los motivos conocidos", () => {
    expect(authErrorMessage("exchange")).toMatch(/token/i);
  });

  it("un motivo desconocido cae al genérico", () => {
    // El `reason` llega por query string. Este test es lo que garantiza que
    // `?reason=Tu cuenta fue bloqueada, llamá al 0800` NO se renderice.
    expect(authErrorMessage("<script>alert(1)</script>")).toBe("No pudimos completar el ingreso.");
    expect(authErrorMessage(null)).toBe("No pudimos completar el ingreso.");
  });
});
