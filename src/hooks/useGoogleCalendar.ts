"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { routes } from "@/lib/routes";
import {
  GCAL_SCOPE,
  clearGoogleCalendarSession,
  getGoogleAccessToken,
  isGoogleCalendarConnected,
  listUpcomingGoogleEvents,
  probeGoogleCalendarAccess,
  saveGoogleAccessToken,
  setGoogleCalendarConnected,
  type GCalLocalEvent,
} from "@/lib/google-calendar";
import { playSnd } from "@/lib/snd";
import { useToast } from "@/components/ui/use-toast";

export function useGoogleCalendar() {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const hydrate = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.provider_token;
      if (token) {
        saveGoogleAccessToken(token);
        setGoogleCalendarConnected(true);
        setConnected(true);
      } else {
        const flagged = isGoogleCalendarConnected();
        const cached = getGoogleAccessToken();
        setConnected(Boolean(flagged && cached));
        if (flagged && !cached) {
          setGoogleCalendarConnected(false);
        }
      }
      setReady(true);
    };

    void hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.provider_token) {
        saveGoogleAccessToken(session.provider_token);
        setGoogleCalendarConnected(true);
        setConnected(true);
      }
      if (event === "SIGNED_OUT") {
        clearGoogleCalendarSession();
        setConnected(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const connect = useCallback(async () => {
    setBusy(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(routes.calendar)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: GCAL_SCOPE,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    });
    if (error) {
      playSnd("caution");
      setBusy(false);
      toast({
        variant: "destructive",
        title: "Não foi possível conectar",
        description: error.message,
      });
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    clearGoogleCalendarSession();
    setConnected(false);
    playSnd("select");
    toast({ title: "Google Calendar desconectado" });
  }, [toast]);

  const importUpcoming = useCallback(async (): Promise<GCalLocalEvent[]> => {
    if (!getGoogleAccessToken()) return [];
    await probeGoogleCalendarAccess();
    return listUpcomingGoogleEvents(30);
  }, []);

  return {
    connected,
    ready,
    busy,
    connect,
    disconnect,
    importUpcoming,
    setConnected,
  };
}
