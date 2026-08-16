"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUsuario } from "@/hooks/useUsuario";
import { QRCodePessoal } from "@/components/qr-code-pessoal/qr-code-pessoal";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { persistLocale } from "@/lib/locale-client";
import { type Locale } from "@/lib/locale";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { routes } from "@/lib/routes";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useLocale, useTranslations } from "next-intl";

type ProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "profile" | "settings";
};

export function ProfileDialog({
  open,
  onOpenChange,
  variant = "profile",
}: ProfileDialogProps) {
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
      router.push(routes.login);
      router.refresh();
    } catch {
      toast({
        title: t("logoutError"),
        description: t("tryAgain"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[420px] overflow-y-auto rounded-[28px] border-white/10 bg-[#151618] p-6 text-white sm:max-w-[440px]">
        <DialogTitle className="sr-only">
          {variant === "settings" ? t("settings") : t("title")}
        </DialogTitle>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/10" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 pt-2">
            {variant === "profile" ? (
              <>
                <QRCodePessoal />
                <div className="w-full text-center">
                  <p className="truncate text-sm text-white/40">
                    {usuario?.email || user?.email}
                  </p>
                </div>
              </>
            ) : null}

            <div className="flex w-full flex-col gap-2">
              {variant === "settings" ? (
                <>
                  <p className="text-center text-xs text-white/35">{t("language")}</p>
                  <div className="mb-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage("pt-BR")}
                      className={`flex-1 rounded-2xl py-2.5 text-sm font-medium transition ${
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
                      className={`flex-1 rounded-2xl py-2.5 text-sm font-medium transition ${
                        locale === "en"
                          ? "bg-white/10 text-white"
                          : "text-white/40 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {t("langEn")}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="w-full rounded-2xl py-3.5 text-sm font-medium text-white/50 transition hover:bg-white/5 hover:text-white"
                  >
                    {t("logout")}
                  </button>
                </>
              ) : null}
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  {t("close")}
                </button>
              </DialogPrimitive.Close>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
