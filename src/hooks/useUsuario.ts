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

/**
 * `useUsuario` roda em vários componentes ao mesmo tempo (nav, página, sino…).
 * Sem limite, cada instância gravava `last_login_at` ao montar: ~6 PATCH em
 * `profiles` por página aberta. Agora é no máximo um por usuário a cada 10 min,
 * compartilhado entre instâncias (e entre abas, via sessionStorage).
 */
const LAST_LOGIN_EVERY_MS = 10 * 60 * 1000;
const lastLoginTouched = new Map<string, number>();

function shouldTouchLastLogin(userId: string, now = Date.now()): boolean {
  const key = `ff:last-login:${userId}`;
  let last = lastLoginTouched.get(userId) ?? 0;
  try {
    last = Math.max(last, Number(sessionStorage.getItem(key)) || 0);
  } catch {
    /* sessionStorage indisponível: fica só o limite em memória */
  }
  if (now - last < LAST_LOGIN_EVERY_MS) return false;
  lastLoginTouched.set(userId, now);
  try {
    sessionStorage.setItem(key, String(now));
  } catch {
    /* idem */
  }
  return true;
}

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
        if (shouldTouchLastLogin(user.id)) void atualizarUltimoLogin(user.id);
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
