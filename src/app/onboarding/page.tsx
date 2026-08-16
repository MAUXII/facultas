"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUsuario } from "@/hooks/useUsuario";
import { salvarInstituicaoUsuario } from "@/lib/user-service";
import {
  INSTITUICOES,
  getInstituicao,
  matchInstituicaoPorEmail,
} from "@/lib/institutions";
import { APP_MARK } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { toast } from "@/components/ui/use-toast";
import { Check } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { usuario, loading: userLoading, refresh } = useUsuario();

  const sugerida = useMemo(
    () => matchInstituicaoPorEmail(user?.email || usuario?.email),
    [user?.email, usuario?.email]
  );

  const [institutionId, setInstitutionId] = useState("");
  const [campusId, setCampusId] = useState("");
  const [curso, setCurso] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading || userLoading) return;
    if (!user) {
      router.replace(routes.login);
      return;
    }
    if (usuario?.institution_id) {
      router.replace(routes.discover);
    }
  }, [user, usuario, authLoading, userLoading, router]);

  useEffect(() => {
    if (sugerida && !institutionId) setInstitutionId(sugerida.id);
  }, [sugerida, institutionId]);

  const instituicao = getInstituicao(institutionId);
  const campi = useMemo(() => instituicao?.campi ?? [], [instituicao]);

  useEffect(() => {
    if (!instituicao) {
      setCampusId("");
      return;
    }
    if (!campi.some((c) => c.id === campusId)) {
      setCampusId(campi[0]?.id || "");
    }
  }, [instituicao, campi, campusId]);

  const handleContinue = async () => {
    if (!user || !institutionId) return;
    setSaving(true);
    try {
      await salvarInstituicaoUsuario(user.id, {
        institutionId,
        campusId: campusId || undefined,
        curso: curso.trim() || undefined,
      });
      await refresh();
      router.replace(routes.discover);
    } catch (err) {
      console.error(err);
      toast({
        title: "Nao foi possivel salvar",
        description: "Tente de novo em instantes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ff-bg)]">
        <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ff-bg)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 pb-10 pt-16 md:pt-24">
        <p className="text-sm font-medium lowercase tracking-tight text-white/40">
          {APP_MARK}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Sua instituicao
        </h1>
        <p className="mt-3 text-base text-white/45">
          A rede e o Campus comecam pela sua faculdade.
        </p>

        <ul className="mt-10 flex flex-col gap-2">
          {INSTITUICOES.map((item) => {
            const selected = institutionId === item.id;
            const auto = sugerida?.id === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setInstitutionId(item.id)}
                  className={`flex w-full items-center justify-between rounded-2xl px-5 py-5 text-left transition ${
                    selected
                      ? "bg-white text-black"
                      : "bg-[var(--ff-surface)] text-white hover:bg-[var(--ff-surface-hover)]"
                  }`}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-lg font-semibold tracking-tight">
                      {item.nome}
                    </span>
                    {auto && (
                      <span
                        className={`text-xs ${
                          selected ? "text-black/45" : "text-white/35"
                        }`}
                      >
                        Sugerida pelo seu e-mail
                      </span>
                    )}
                  </span>
                  {selected && (
                    <Check className="h-5 w-5" strokeWidth={1.75} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {campi.length > 0 && (
          <div className="mt-8">
            <label className="text-sm text-white/40">Campus</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {campi.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCampusId(c.id)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    campusId === c.id
                      ? "bg-white/15 text-white"
                      : "bg-transparent text-white/40 hover:text-white/70"
                  }`}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className="text-sm text-white/40" htmlFor="curso">
            Curso (opcional)
          </label>
          <input
            id="curso"
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
            placeholder="Ex.: ADS, SI, Engenharia"
            className="mt-2 w-full rounded-2xl border-0 bg-[var(--ff-surface)] px-5 py-4 text-base text-white outline-none placeholder:text-white/25 focus:ring-1 focus:ring-white/20"
          />
        </div>

        <button
          type="button"
          disabled={!institutionId || saving}
          onClick={() => void handleContinue()}
          className="mt-auto w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
        >
          {saving ? "Salvando…" : "Continuar"}
        </button>
      </div>
    </div>
  );
}
