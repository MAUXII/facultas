"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useUsuario } from "@/hooks/useUsuario";
import { gerarQRPessoalParaUsuario } from "@/lib/user-service";
import { QRCodePessoalData } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw } from "lucide-react";

type QRCodePessoalProps = {
  compact?: boolean;
};

export function QRCodePessoal({ compact = false }: QRCodePessoalProps) {
  const { usuario, loading } = useUsuario();
  const [qrData, setQrData] = useState<QRCodePessoalData | null>(null);
  const [gerando, setGerando] = useState(false);

  const gerarQRCode = async () => {
    if (!usuario) return;

    try {
      setGerando(true);
      const data = await gerarQRPessoalParaUsuario(usuario.id);
      setQrData(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Não foi possível gerar o QR",
        description: "Tente de novo em instantes.",
      });
    } finally {
      setGerando(false);
    }
  };

  useEffect(() => {
    if (usuario && !qrData) {
      void gerarQRCode();
    }
  }, [usuario]);

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/10" />
      </div>
    );
  }

  if (!usuario) {
    return (
      <p className="py-10 text-center text-sm text-white/40">
        Entre para ver seu QR.
      </p>
    );
  }

  const size = compact ? 220 : 280;
  const nome = usuario.name?.split(" ")[0] || "Você";

  return (
    <div className="flex w-full flex-col items-center gap-6 py-2">
      <div className="relative">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.8)]">
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
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xl font-semibold tracking-tight text-white">
          {nome}
        </p>
        {qrData && (
          <p className="text-xs text-white/35">
            Atualiza{" "}
            {new Date(qrData.expiresAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

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
