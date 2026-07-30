"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "overview", label: "Resumen" },
  { value: "spots", label: "Stands" },
  { value: "participants", label: "Visitantes" },
  { value: "analytics", label: "Estadísticas" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const isTab = (value: string): value is TabValue =>
  TABS.some((tab) => tab.value === value);

type EventTabsProps = Readonly<Record<TabValue, React.ReactNode>>;

/**
 * Tabs del detalle, con el activo en el hash (`#stands`).
 *
 * Va en el hash y no en la query porque el hash no viaja al servidor: cambiar
 * de tab no vuelve a ejecutar el server component ni a consultar los datos,
 * que ya vienen todos en el primer render.
 *
 * El hash no existe durante el render del servidor, así que el tab correcto se
 * aplica al montar: al entrar con un `#tab` puede verse un instante el
 * resumen. El precio es bajo comparado con recargar la página entera.
 */
export function EventTabs(slots: EventTabsProps) {
  const [tab, setTab] = useState<TabValue>("overview");

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (isTab(hash)) setTab(hash);
    };

    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const change = (value: string) => {
    if (!isTab(value)) return;

    setTab(value);
    // replaceState en vez de asignar location.hash: no agrega una entrada al
    // historial por cada click ni dispara el scroll al elemento con ese id.
    window.history.replaceState(null, "", `#${value}`);
  };

  return (
    <Tabs value={tab} onValueChange={change}>
      <TabsList>
        {TABS.map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map(({ value }) => (
        <TabsContent key={value} value={value}>
          {slots[value]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
