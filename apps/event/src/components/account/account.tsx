"use client";

import { Loader } from "@nsmr/pixelart-react";
import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { ORGANIZER_ROLES } from "@/utils";
import Profile from "./profile";
import SignIn from "./signin";

export default function Account() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;

      setUser((previousUser) => {
        if (nextUser === null) return null;
        if (previousUser?.id === nextUser.id) return previousUser;
        return nextUser;
      });
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // El rol de admin se resuelve en el cliente (antes lo pasaba el Header server).
  // Es solo para mostrar/ocultar los accesos de organizador; /raffle y el
  // dashboard igual están protegidos server-side. RLS permite al usuario leer su
  // propia membresía.
  //
  // El filtro por rol es el mismo que `isOrganizer()`: sin él, un SPOT_OWNER
  // vería en el menú accesos que después le rebotan.
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    let active = true;
    supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", user.id)
      .in("role", ORGANIZER_ROLES)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setIsAdmin(Boolean(data));
      });

    return () => {
      active = false;
    };
  }, [supabase, user]);

  return (
    <article className="h-full max-w-20 md:max-w-none w-62.5 flex items-center justify-center">
      {user === undefined && (
        <Loader className="size-6 animate-spin text-foreground/50" />
      )}
      {user === null && (
        <SignIn
          className="relative h-full rounded-none border-y-0 max-w-full w-full [&>span]:hidden md:[&>span]:block"
          variant="outline"
        />
      )}
      {user && <Profile user={user} isAdmin={isAdmin} />}
    </article>
  );
}
