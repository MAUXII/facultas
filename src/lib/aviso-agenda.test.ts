import { describe, expect, test } from "vitest";
import {
  AVISO_BLOCK_MS,
  avisoSpan,
  avisoTitle,
  mentionsMissingAgenda,
  normalizeAvisoAgenda,
} from "./aviso-agenda";

describe("aviso na agenda", () => {
  test("aviso sem data continua válido e não empurra o calendário", () => {
    expect(normalizeAvisoAgenda()).toEqual({
      ok: true,
      value: { at: null, pushToCalendar: false },
    });
  });

  test("mandar para o calendário sem data é inválido", () => {
    expect(normalizeAvisoAgenda({ pushToCalendar: true })).toEqual({
      ok: false,
    });
  });

  test("data inválida é inválida", () => {
    expect(normalizeAvisoAgenda({ at: "não é data" })).toEqual({ ok: false });
  });

  test("data vira instante ISO e pode ficar só no aviso", () => {
    const result = normalizeAvisoAgenda({ at: "2026-10-28T19:00:00-03:00" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.pushToCalendar).toBe(false);
    expect(result.value.at).toBe("2026-10-28T22:00:00.000Z");
  });

  test("título é a primeira linha, cortada em 80", () => {
    expect(avisoTitle("Prova de cálculo\nSala 12")).toBe("Prova de cálculo");
    const long = "a".repeat(90);
    expect(avisoTitle(long)).toHaveLength(80);
    expect(avisoTitle(long).endsWith("…")).toBe(true);
  });

  test("o bloco na agenda dura uma hora", () => {
    const start = new Date("2026-10-28T22:00:00.000Z");
    const span = avisoSpan(start);
    expect(span.end.getTime() - span.start.getTime()).toBe(AVISO_BLOCK_MS);
  });

  test("coluna ausente é reconhecida pela mensagem do banco", () => {
    expect(mentionsMissingAgenda({ message: "column agenda_at does not exist" })).toBe(
      true,
    );
    expect(mentionsMissingAgenda({ message: "permission denied" })).toBe(false);
  });
});
