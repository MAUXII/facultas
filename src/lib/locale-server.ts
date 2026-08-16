import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale, type Locale } from "@/lib/locale";
import pt from "@/messages/pt-BR.json";
import en from "@/messages/en.json";

const catalog = {
  "pt-BR": pt,
  en,
} as const;

export function getLocale(): Locale {
  return parseLocale(cookies().get(LOCALE_COOKIE)?.value);
}

export function getMessages(locale: Locale) {
  return catalog[locale];
}
