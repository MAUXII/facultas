"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { GooeyCompose } from "@/components/ui/gooey-compose";
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
    <div className="flex justify-center gap-2">
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
          className="h-12 w-10 rounded-[8px] bg-white/[0.06] text-center font-mono text-lg tracking-widest text-white outline-none ring-1 ring-white/10 transition focus:ring-white/35"
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
      if (result.already && result.status === "pending") {
        toast({ title: t("pendingAlready") });
      } else if (result.already) {
        toast({ title: t("alreadyMember") });
      } else if (result.status === "pending") {
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
    <GooeyCompose
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("title")}
      submitLabel={saving ? t("joining") : t("submit")}
      submitDisabled={saving || normalizeCode(code).length < ACCESS_CODE_LENGTH}
      onSubmit={() => void submit()}
      width={400}
      bodyClassName="pb-2"
    >
      <p className="mb-5 text-[13px] text-white/45">{t("hint")}</p>
      <CodeOtp
        key={open ? "open" : "closed"}
        value={code}
        onChange={setCode}
        disabled={saving}
      />
    </GooeyCompose>
  );
}
