"use client";

import { useState, useEffect, useCallback } from "react";
import type { Usuario } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import {
  buscarUsuario,
  garantirUsuario,
  atualizarUltimoLogin,
} from "@/lib/user-service";

type UseUsuarioReturn = {
  usuario: Usuario | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function useUsuario(): UseUsuarioReturn {
  const { user, loading: loadingAuth } = useAuth();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const carregarUsuario = useCallback(async () => {
    if (!user) {
      setUsuario(null);
      setLoading(false);
      return;
    }

    const safety =
      typeof window !== "undefined"
        ? window.setTimeout(() => setLoading(false), 10000)
        : undefined;

    try {
      setLoading(true);
      setError(null);

      let data = await buscarUsuario(user.id);
      if (!data) {
        data = await garantirUsuario({
          id: user.id,
          email: user.email || "",
          nome:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "Usuario",
          foto_url: user.user_metadata?.avatar_url || null,
        });
      } else {
        void atualizarUltimoLogin(user.id);
      }

      setUsuario(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao carregar usuario"));
      console.error(err);
    } finally {
      if (safety !== undefined) window.clearTimeout(safety);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loadingAuth) {
      void carregarUsuario();
    }
  }, [user, loadingAuth, carregarUsuario]);

  return {
    usuario,
    loading: loading || loadingAuth,
    error,
    refresh: carregarUsuario,
  };
}
