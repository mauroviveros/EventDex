import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser, getMembership } from "@/server/auth";

export const metadata: Metadata = { title: "Sin acceso" };

/**
 * Sesión válida pero sin acceso al dashboard: la cuenta no es miembro de
 * ninguna organización, o lo es con un rol que no administra eventos (un
 * `SPOT_OWNER`). Es un caso distinto de "no estás logueado", por eso tiene
 * pantalla propia y la salida es cerrar sesión y entrar con otra cuenta.
 */
export default async function DeniedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Si en realidad ya es organizador (p. ej. lo acaban de agregar), no tiene
  // nada que hacer acá.
  const membership = await getMembership(user.id);
  if (membership) redirect("/events");

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Sin acceso</CardTitle>
          <CardDescription>
            La cuenta <span className="font-medium">{user.email}</span> no tiene
            permisos para administrar eventos. Pedile a un administrador de tu
            organización que te dé acceso, o entrá con otra cuenta.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
