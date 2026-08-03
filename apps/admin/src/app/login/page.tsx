import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/server/auth";
import { resolveSafeNextPath } from "@/utils";
import { signInWithGoogle } from "./actions";

export const metadata: Metadata = { title: "Ingresar" };

/** Logo de Google, simplificado a un solo trazo monocromo. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.6 3.9-5.35 3.9a6 6 0 1 1 0-12c1.5 0 2.9.55 3.95 1.55l2.15-2.15A9 9 0 1 0 12 21c5.2 0 8.85-3.65 8.85-8.8 0-.37-.03-.74-.1-1.1Z"
      />
    </svg>
  );
}

type LoginPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  // `next` llega de la URL: se sanea para que un link armado desde afuera no
  // pueda usar el login como trampolín a otro dominio.
  const next = resolveSafeNextPath(
    typeof params.next === "string" ? params.next : null,
  );

  // Con sesión abierta no hay nada que pedir; el guard del dashboard decide si
  // además es organizador.
  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Eventdex</CardTitle>
          <CardDescription>
            Ingresá con tu cuenta de organizador para administrar tus eventos.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <form action={signInWithGoogle.bind(null, next)}>
            <Button type="submit" className="w-full">
              <GoogleIcon />
              Continuar con Google
            </Button>
          </form>

          {typeof params.error === "string" && (
            <p className="text-center text-destructive text-sm">
              No pudimos iniciar sesión. Probá de nuevo.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
