import type { User } from "@supabase/supabase-js";
import { ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter as SidebarFooterWrapper,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserDropdownMenu } from "./user-dropdown-menu";
import { UserLabel } from "./user-label";

type SidebarFooterProps = Readonly<{ user: User }>;
export function SidebarFooter({ user }: SidebarFooterProps) {
  const metadata = {
    name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      "Organizador",
    email: user.email ?? "",
    avatar: user.user_metadata?.avatar_url ?? null,
  };

  return (
    <SidebarFooterWrapper>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg">
                <UserLabel metadata={metadata} />
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <UserDropdownMenu>
              <UserLabel metadata={metadata} />
            </UserDropdownMenu>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooterWrapper>
  );
}
