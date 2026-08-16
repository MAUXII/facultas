"use client";

import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { playRuixenClick } from "@/lib/ruixen-click";
import {
  ACCESS_CODE_LENGTH,
  createJoin,
  JoinError,
  normalizeCode,
} from "@/lib/join";
import { supabaseJoinPort } from "@/lib/join-supabase";

function CodeOtp({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const apply = (next: string, from: number) => {
    const code = normalizeCode(next).slice(0, ACCESS_CODE_LENGTH);
    onChange(code);
    const focusAt = Math.min(code.length, ACCESS_CODE_LENGTH - 1);
    const target = code.length <= from ? from : focusAt;
    requestAnimationFrame(() => refs.current[target]?.focus());
  };

  return (
    <div className="flex gap-2 sm:gap-2.5">
      {Array.from({ length: ACCESS_CODE_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={value[index] ?? ""}
          disabled={disabled}
          inputMode="text"
          autoComplete="one-time-code"
          aria-label={`Dígito ${index + 1} do código`}
          maxLength={1}
          className="h-12 w-10 rounded-xl bg-white/10 text-center font-mono text-lg tracking-widest text-white outline-none ring-1 ring-white/10 transition focus:ring-white/35 sm:h-14 sm:w-12 sm:text-xl"
          onChange={(event) => {
            const typed = normalizeCode(event.target.value);
            if (!typed) {
              const next = `${value.slice(0, index)}${value.slice(index + 1)}`;
              onChange(next);
              return;
            }
            const chars = Array.from(
              { length: ACCESS_CODE_LENGTH },
              (_, slot) => value[slot] ?? "",
            );
            chars[index] = typed.slice(-1);
            apply(chars.join(""), index);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Backspace") return;
            event.preventDefault();
            if (value[index]) {
              onChange(`${value.slice(0, index)}${value.slice(index + 1)}`);
              return;
            }
            if (index > 0) {
              onChange(value.slice(0, index - 1) + value.slice(index));
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            apply(event.clipboardData.getData("text"), 0);
          }}
        />
      ))}
    </div>
  );
}

export function JoinByCodeDialog({
  open,
  onOpenChange,
  userId,
  onJoined,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onJoined: (communityId: string, status: "active" | "pending") => void;
}) {
  const t = useTranslations("join");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setCode("");
  }, [open]);

  const submit = async () => {
    if (normalizeCode(code).length < ACCESS_CODE_LENGTH) return;
    setSaving(true);
    playRuixenClick("action");
    try {
      const result = await createJoin(supabaseJoinPort()).byCode(userId, code);
      setCode("");
      onOpenChange(false);
      if (result.status === "pending") {
        toast({ title: t("pending"), description: t("pendingHint") });
      } else {
        toast({ title: t("active") });
      }
      onJoined(result.publicId, result.status);
    } catch (err) {
      console.error(err);
      if (err instanceof JoinError && err.code === "invalid") {
        toast({ title: t("invalid"), variant: "destructive" });
      } else if (err instanceof JoinError && err.code === "not_found") {
        toast({ title: t("notFound"), variant: "destructive" });
      } else {
        toast({
          title: t("error"),
          description: t("errorHint"),
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

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
          <div className="mx-auto flex min-h-full w-full max-w-[var(--ff-max-width)] flex-col px-5 pb-10 pt-16 sm:px-8">
            <div className="mb-12 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={saving || normalizeCode(code).length < ACCESS_CODE_LENGTH}
                onClick={() => void submit()}
                className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
              >
                {saving ? t("joining") : t("submit")}
              </button>
            </div>

            <DialogTitle className="ff-display text-4xl font-medium tracking-tight text-white/50 md:text-5xl">
              {t("title")}
            </DialogTitle>
            <p className="mt-3 max-w-md text-sm text-white/40">{t("hint")}</p>

            <form
              className="mt-12"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <CodeOtp
                key={open ? "open" : "closed"}
                value={code}
                onChange={setCode}
                disabled={saving}
              />
            </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
