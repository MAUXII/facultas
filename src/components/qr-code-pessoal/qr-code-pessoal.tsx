"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useUsuario } from "@/hooks/useUsuario";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw } from "lucide-react";

type QrPayload = {
  token: string;
  qrCodeUrl: string;
  expiresAt: string;
};

type QRCodePessoalProps = {
  compact?: boolean;
};

export function QRCodePessoal({ compact = false }: QRCodePessoalProps) {
  const { usuario, loading } = useUsuario();
  const [qrData, setQrData] = useState<QrPayload | null>(null);
  const [gerando, setGerando] = useState(false);

  const gerarQRCode = useCallback(async () => {
    if (!usuario) return;

    try {
      setGerando(true);
      const res = await fetch("/api/qr/personal", { method: "POST" });
      if (!res.ok) throw new Error("qr_failed");
      const data = (await res.json()) as QrPayload;
      setQrData(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Nao foi possivel gerar o QR",
        description: "Tente de novo em instantes.",
      });
    } finally {
      setGerando(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (usuario && !qrData && !gerando) {
      void gerarQRCode();
    }
  }, [usuario, qrData, gerando, gerarQRCode]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-start justify-start">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/10" />
      </div>
    );
  }

  if (!usuario) {
    return (
      <p className="py-10 text-sm text-white/40">Entre para ver seu QR.</p>
    );
  }

  const size = compact ? 200 : 260;

  return (
    <div className="flex w-full flex-col items-start gap-5">
      <div className="rounded-[24px] bg-white p-4 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.8)]">
        {qrData ? (
          <QRCodeCanvas
            id="qr-code-canvas"
            value={qrData.qrCodeUrl}
            size={size}
            level="H"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#0a0a0a"
          />
        ) : (
          <div
            className="animate-pulse rounded-2xl bg-neutral-100"
            style={{ width: size, height: size }}
          />
        )}
      </div>

      {qrData ? (
        <p className="text-xs text-white/35">
          Atualiza{" "}
          {new Date(qrData.expiresAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void gerarQRCode()}
        disabled={gerando}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/45 transition hover:bg-white/5 hover:text-white/80 disabled:opacity-50"
      >
        <RefreshCw
          className={`h-4 w-4 ${gerando ? "animate-spin" : ""}`}
          strokeWidth={1.5}
        />
        {gerando ? "Atualizando" : "Atualizar QR"}
      </button>
    </div>
  );
}
