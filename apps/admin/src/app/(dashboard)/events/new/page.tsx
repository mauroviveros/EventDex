import { Header } from "@/components/header";
import { requireMembership } from "@/server/guard";
import { NewEventForm } from "./_components/form";

export default async function NewEventPage() {
  // No usa los datos, pero el guard tiene que correr igual: sin membresía no
  // se llega al formulario.
  await requireMembership();

  return (
    <>
      <Header
        items={[
          { label: "Eventos", href: "/events" },
          { label: "Nuevo evento" },
        ]}
      />

      <main className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-2xl tracking-tight">
            Crear evento
          </h2>
          <p className="text-muted-foreground text-sm">
            Cargá los datos básicos y la primera jornada. Los stands se agregan
            después, desde el detalle del evento.
          </p>
        </div>

        <NewEventForm />
      </main>
    </>
  );
}
