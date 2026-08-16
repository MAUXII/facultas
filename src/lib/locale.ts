const locales = ["pt-BR", "en"] as const;

export type Locale = (typeof locales)[number];

const defaultLocale: Locale = "pt-BR";

export const LOCALE_COOKIE = "ff-locale";

export function parseLocale(value: string | undefined | null): Locale {
  if (value === "en" || value === "pt-BR") return value;
  return defaultLocale;
}
