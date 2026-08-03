import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { SpotFormSkeleton } from "../_components/form-skeleton";

export default function NewSpotLoading() {
  return (
    <>
      <Header
        items={[
          { label: "Eventos", href: "/events", key: "events" },
          { label: <Skeleton className="h-4 w-40" />, key: "event" },
          { label: "Nuevo stand", key: "new" },
        ]}
      />

      <main className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>

        <SpotFormSkeleton />
      </main>
    </>
  );
}
