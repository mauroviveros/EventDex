'use client';

import { SidebarContent as SidebarContentWrapper, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { title: "Dashboard", href: "/", Icon: LayoutDashboard },
]

export function SidebarContent() {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <SidebarContentWrapper>
      <SidebarGroup>
        <SidebarGroupLabel>Navegación</SidebarGroupLabel>
        <SidebarMenu>
          {NAV_ITEMS.map(({ title, href, Icon }, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton
                isActive={isActive(href)}
                tooltip={title}
                asChild
              >
                <Link href={href}>
                  <Icon />
                  <span>{title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContentWrapper>
  )
}
