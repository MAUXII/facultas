import { describe, expect, test } from "vitest";
import {
  assertSettings,
  defaultSettings,
  fromForm,
  settingsFrom,
  SettingsError,
  toForm,
} from "./community-settings";

describe("Community settings", () => {
  test("new turma defaults to representante-only writers", () => {
    expect(defaultSettings("turma")).toEqual({
      kind: "turma",
      publica: true,
      requerAprovacao: false,
      avisosWriters: "admins",
      materiaisWriters: "admins",
      peloLink: false,
    });
  });

  test("new grupo also defaults to representante-only writers", () => {
    expect(defaultSettings("grupo").avisosWriters).toBe("admins");
    expect(defaultSettings("grupo").materiaisWriters).toBe("admins");
  });

  test("settingsFrom treats missing columns as the turma default writers", () => {
    expect(settingsFrom({})).toMatchObject({
      avisosWriters: "admins",
      materiaisWriters: "admins",
      publica: true,
      requerAprovacao: false,
    });
  });

  test("settingsFrom maps visibility code to not publica", () => {
    expect(settingsFrom({ visibility: "code", kind: "grupo" }).publica).toBe(
      false,
    );
  });

  test("fromForm maps member toggles to writers policy", () => {
    expect(
      fromForm({
        kind: "turma",
        publica: false,
        requerAprovacao: true,
        membrosAvisos: true,
        membrosMateriais: false,
        peloLink: true,
      }),
    ).toEqual({
      kind: "turma",
      publica: false,
      requerAprovacao: true,
      avisosWriters: "members",
      materiaisWriters: "admins",
      peloLink: true,
    });
  });

  test("toForm round-trips the member toggles", () => {
    const form = {
      kind: "turma" as const,
      publica: false,
      requerAprovacao: true,
      membrosAvisos: true,
      membrosMateriais: false,
      peloLink: true,
    };
    expect(toForm(fromForm(form))).toEqual(form);
  });

  test("turma without institution is invalid", () => {
    expect(() =>
      assertSettings(defaultSettings("turma"), null),
    ).toThrow(SettingsError);
    try {
      assertSettings(defaultSettings("turma"), null);
    } catch (err) {
      expect(err).toMatchObject({ code: "needs_institution" });
    }
  });

  test("monitoria without institution is invalid", () => {
    expect(() =>
      assertSettings(defaultSettings("monitoria"), undefined),
    ).toThrow(SettingsError);
  });

  test("grupo without institution is valid", () => {
    expect(() => assertSettings(defaultSettings("grupo"), null)).not.toThrow();
  });

  test("link access defaults off when the column is absent", () => {
    expect(settingsFrom({ visibility: "code" }).peloLink).toBe(false);
    expect(settingsFrom({ link_access: true }).peloLink).toBe(true);
  });

  test("turma with institution is valid", () => {
    expect(() =>
      assertSettings(defaultSettings("turma"), "fatec"),
    ).not.toThrow();
  });
});
