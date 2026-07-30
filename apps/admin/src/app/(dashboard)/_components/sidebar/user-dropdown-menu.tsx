"use client";

import { LogOut } from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";

type UserDropdownMenuProps = Readonly<React.PropsWithChildren>;
export function UserDropdownMenu({ children }: UserDropdownMenuProps) {
  const { isMobile } = useSidebar();

  return (
    <DropdownMenuContent
      className="min-w-56"
      side={isMobile ? "bottom" : "right"}
      align="end"
    >
      <DropdownMenuGroup>
        <DropdownMenuLabel>
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            {children}
          </div>
        </DropdownMenuLabel>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem variant="destructive">
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}
