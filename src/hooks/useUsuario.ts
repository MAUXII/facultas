"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Usuario } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import {
  buscarUsuario,
  garantirUsuario,
  atualizarUltimoLogin,
  syncAvatarUrl,
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
  const usuarioRef = useRef<Usuario | null>(null);
  usuarioRef.current = usuario;

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
      if (!usuarioRef.current) setLoading(true);
      setError(null);

      let data = await buscarUsuario(user.id);
      const metaAvatar =
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null;

      if (!data) {
        data = await garantirUsuario({
          id: user.id,
          email: user.email || "",
          nome:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "Usuario",
          foto_url: metaAvatar,
        });
      } else {
        void atualizarUltimoLogin(user.id);
        if (!data.avatar_url) {
          data = (await syncAvatarUrl(user.id, metaAvatar)) || data;
        }
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
