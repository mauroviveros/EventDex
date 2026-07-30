import { Sidebar as SidebarWrapper } from "@/components/ui/sidebar";
import { SidebarContent } from "./content";
import { SidebarFooter } from "./footer";
import { SidebarHeader } from "./header";

type SidebarProps = React.ComponentProps<typeof SidebarHeader> &
  React.ComponentProps<typeof SidebarFooter>;
export function Sidebar({ organization, user }: SidebarProps) {
  return (
    <SidebarWrapper collapsible="icon">
      <SidebarHeader organization={organization} />
      <SidebarContent />
      <SidebarFooter user={user} />
    </SidebarWrapper>
  );
}
