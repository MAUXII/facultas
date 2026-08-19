"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUsuario } from "@/hooks/useUsuario";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { persistLocale } from "@/lib/locale-client";
import { type Locale } from "@/lib/locale";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { routes } from "@/lib/routes";
import { useLocale, useTranslations } from "next-intl";

type ProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();
  const { usuario, loading } = useUsuario();
  const router = useRouter();
  const t = useTranslations("profile");
  const locale = useLocale();

  const setLanguage = (next: Locale) => {
    if (next === locale) return;
    persistLocale(next);
    router.refresh();
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      onOpenChange(false);
      toast({
        title: t("loggedOut"),
        description: t("loggedOutHint"),
      });
      router.push(routes.discover);
      router.refresh();
    } catch {
      toast({
        title: t("logoutError"),
        description: t("tryAgain"),
        variant: "destructive",
      });
    }
  };

  const avatarUrl =
    usuario?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;
  const displayName =
    usuario?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Voce";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const email = usuario?.email || user?.email || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-2xl" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[var(--ff-max-width)] flex-col px-5 pb-16 pt-16 sm:px-8">
            <div className="mb-12 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
              >
                {t("close")}
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
              >
                {t("logout")}
              </button>
            </div>

            <DialogTitle className="ff-display text-4xl font-medium tracking-tight text-white/50 md:text-5xl">
              {t("settings")}
            </DialogTitle>

            {loading ? (
              <div className="mt-16 flex justify-center">
                <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/10" />
              </div>
            ) : (
              <div className="mt-12 flex max-w-md flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/35">
                        {initial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-white">
                      {displayName}
                    </p>
                    {email ? (
                      <p className="truncate text-sm text-white/40">{email}</p>
                    ) : null}
                  </div>
                </div>

                <p className="text-sm text-white/40">{t("language")}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage("pt-BR")}
                    className={`flex-1 rounded-2xl py-3 text-sm font-medium transition ${
                      locale === "pt-BR"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {t("langPt")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`flex-1 rounded-2xl py-3 text-sm font-medium transition ${
                      locale === "en"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {t("langEn")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
