"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listarMinhasComunidades } from "@/lib/comunidade-service";
import type { Community } from "@/types";
import { toast } from "@/components/ui/use-toast";

type CommunitiesContextProps = {
  communities: Community[];
  /** A lista já veio do servidor ao menos uma vez para este usuário. */
  loaded: boolean;
  fetchCommunities: () => Promise<void>;
};

const CommunitiesContext = createContext<CommunitiesContextProps | undefined>(
  undefined,
);

export function useCommunities() {
  const context = useContext(CommunitiesContext);
  if (!context) {
    throw new Error("useCommunities must be used within CommunitiesProvider");
  }
  return context;
}

export function CommunitiesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCommunities = useCallback(async () => {
    if (!user) {
      setCommunities([]);
      return;
    }
    try {
      const rows = await listarMinhasComunidades(user.id);
      setCommunities(rows);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao buscar comunidades",
        description: "Tente de novo em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoadedFor(user.id);
    }
  }, [user]);

  const loaded = Boolean(user) && loadedFor === user?.id;

  return (
    <CommunitiesContext.Provider
      value={{ communities, loaded, fetchCommunities }}
    >
      {children}
    </CommunitiesContext.Provider>
  );
}
