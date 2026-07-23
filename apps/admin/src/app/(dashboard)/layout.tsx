import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "./_components/sidebar";
import { requireMembership } from "@/server/guard";

export default async function DashboardLayout({ children }: Readonly<React.PropsWithChildren>) {
  const { user, membership } = await requireMembership();

  return (
    <SidebarProvider>
      <Sidebar organization={membership.organization} user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
