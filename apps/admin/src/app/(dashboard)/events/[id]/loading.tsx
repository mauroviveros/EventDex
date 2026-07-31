import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { EventDetailSkeleton } from "./_components/skeleton";

/**
 * El nombre del evento todavía no se conoce, así que el último tramo del
 * breadcrumb va como placeholder en lugar de un texto inventado.
 */
export default function EventDetailLoading() {
  return (
    <>
      <Header
        items={[
          { label: "Eventos", href: "/events", key: "events" },
          { label: <Skeleton className="h-4 w-40" />, key: "current" },
        ]}
      />
      <EventDetailSkeleton />
    </>
  );
}
