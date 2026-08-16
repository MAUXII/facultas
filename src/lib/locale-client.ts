"use client";

import { LOCALE_COOKIE, type Locale } from "@/lib/locale";

export function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
}
