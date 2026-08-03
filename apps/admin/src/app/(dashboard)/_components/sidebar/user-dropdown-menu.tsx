"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";
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
        {/* Un form con la action: cerrar sesión escribe cookies, así que tiene
            que ser un POST y no un handler de click. */}
        <form action={signOut}>
          <DropdownMenuItem variant="destructive" asChild>
            <button type="submit" className="w-full">
              <LogOut />
              Cerrar sesión
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}
