import { ChevronsUpDown, Ticket } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarHeader as SidebarHeaderWrapper,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Tables } from "@/types";
import { cn } from "@/utils";

type SidebarHeaderProps = Readonly<{
  organization: Pick<Tables<"organizations">, "id" | "name" | "slug">;
}>;
export function SidebarHeader({ organization }: SidebarHeaderProps) {
  return (
    <SidebarHeaderWrapper>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg">
                <div
                  className={cn([
                    "flex items-center justify-center",
                    "size-8 rounded-lg aspect-square",
                    "bg-sidebar-primary text-sidebar-primary-foreground",
                  ])}
                >
                  <Ticket className="size-4" />
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {organization?.name ?? "Organizador"}
                  </span>
                  <span className="truncate text-xs">Eventdex</span>
                </div>

                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeaderWrapper>
  );
}
