"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { Link2 } from "lucide-react";
import { GooeyCompose } from "@/components/ui/gooey-compose";
import { createHub, HubError } from "@/lib/hub";
import { supabaseHubPort } from "@/lib/hub-supabase";
import { playRuixenClick } from "@/lib/ruixen-click";
import { toast } from "@/components/ui/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  userId: string;
  onSaved: () => Promise<void> | void;
  anchorRef?: RefObject<HTMLElement | null>;
};

export function MaterialDialog({
  open,
  onOpenChange,
  communityId,
  userId,
  onSaved,
  anchorRef,
}: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setUrl("");
  }, [open]);

  const close = () => onOpenChange(false);

  const save = async () => {
    const name = title.trim();
    const href = url.trim();
    if (!name || !href) return;
    setSaving(true);
    playRuixenClick("action");
    try {
      const normalized = href.startsWith("http") ? href : `https://${href}`;
      await createHub(supabaseHubPort()).addMaterial(
        communityId,
        userId,
        name,
        normalized,
      );
      await onSaved();
      close();
      toast({ title: "Material adicionado" });
    } catch (err) {
      console.error(err);
      const description =
        err instanceof HubError
          ? err.code === "forbidden"
            ? "Você não pode adicionar material aqui."
            : "Preencha nome e link."
          : "Não deu para salvar o material.";
      toast({
        title: "Não deu para salvar",
        description,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <GooeyCompose
      open={open}
      onClose={close}
      anchorRef={anchorRef}
      title="Novo material"
      onSubmit={() => void save()}
      submitLabel={saving ? "Salvando…" : "Adicionar"}
      submitDisabled={saving || !title.trim() || !url.trim()}
    >
      <div className="flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nome do material"
          aria-label="Nome do material"
          data-ff-bare-input=""
          autoFocus
          className="w-full border-0 bg-transparent text-xl font-medium text-white outline-none placeholder:text-white/25"
        />
        <div className="flex items-center gap-2 rounded-[8px] bg-white/[0.06] px-3 py-2">
          <Link2 className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.75} />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link do PDF, Drive ou site"
            aria-label="Link"
            data-ff-bare-input=""
            inputMode="url"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>
      </div>
    </GooeyCompose>
  );
}
