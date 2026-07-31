import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Un tramo del breadcrumb; sin `href` es la página actual. */
/**
 * `label` acepta nodos y no solo texto para que las pantallas de carga puedan
 * poner un skeleton en lugar del título que todavía no se conoce.
 */
export type Crumb = { label: React.ReactNode; href?: string; key?: string };

type HeaderProps = Readonly<{
  /** Tramos de la ruta, del más general al actual: [Eventos, Lo de Charly]. */
  items: Crumb[];
  children?: React.ReactNode;
}>;

/**
 * Header común de las páginas del dashboard: trigger del sidebar + breadcrumb.
 *
 * En mobile solo se muestra el último tramo (la página actual): el resto vive
 * en el sidebar y repetirlo comería el ancho que necesitan el título largo y
 * las acciones de la derecha.
 */
export function Header({ items, children }: HeaderProps) {
  const current = items[items.length - 1];
  const parents = items.slice(0, -1);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2" />

      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap">
          {parents.map((crumb, index) => (
            <Fragment key={crumb.key ?? crumb.href ?? index}>
              <BreadcrumbItem className="hidden sm:flex">
                {crumb.href ? (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  crumb.label
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
            </Fragment>
          ))}

          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate font-semibold text-base">
              {current?.label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {children && <div className="ml-auto shrink-0">{children}</div>}
    </header>
  );
}
