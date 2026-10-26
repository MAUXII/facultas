"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodePessoal } from "@/components/qr-code-pessoal/qr-code-pessoal";
import { useTranslations } from "next-intl";

type QrCodeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QrCodeDialog({ open, onOpenChange }: QrCodeDialogProps) {
  const t = useTranslations("profile");

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
            </div>

            <DialogTitle className="ff-display text-4xl font-medium tracking-tight text-white/50 md:text-5xl">
              {t("qrTitle")}
            </DialogTitle>
            <p className="mt-3 max-w-md text-sm text-white/60">{t("qrHint")}</p>

            <div className="mt-12 flex justify-start">
              <QRCodePessoal compact />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
