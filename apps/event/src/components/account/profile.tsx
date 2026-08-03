"use client";

import {
  ChevronDown,
  Dashboard,
  Logout,
  Trophy,
  User as UserIcon,
} from "@nsmr/pixelart-react";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { env } from "@/config/env";
import { createClient } from "@/libs/supabase/client";

export default function Profile({
  user,
  isAdmin = false,
}: {
  user: User;
  isAdmin?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-full rounded-none max-w-full"
          type="button"
          variant="default"
        >
          <Image
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.full_name}
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="size-10"
          />

          <div className="hidden md:flex flex-col min-w-0 text-left">
            <span className="text-xl leading-5 font-bold truncate">
              {user.user_metadata.full_name}
            </span>
            <span className="text-lg leading-3 opacity-70 truncate">
              {user.email}
            </span>
          </div>

          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rounded-none">
        <DropdownMenuItem className="text-lg" asChild>
          <Link href="/perfil">
            <UserIcon className="size-5" />
            Mi perfil
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-lg" asChild>
              <Link href="/raffle">
                <Trophy className="size-5" />
                Sorteo
              </Link>
            </DropdownMenuItem>

            {/* Enlace externo: el dashboard es otra app, así que va con <a> y
                no con <Link> (no hay prefetch ni navegación cliente posible). */}
            {env.DASHBOARD_URL && (
              <DropdownMenuItem className="text-lg" asChild>
                <a href={env.DASHBOARD_URL}>
                  <Dashboard className="size-5" />
                  Dashboard
                </a>
              </DropdownMenuItem>
            )}
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="text-lg"
          onSelect={handleSignOut}
        >
          <Logout className="size-5" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
