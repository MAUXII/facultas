import { routes } from "@/lib/routes";

export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  if (value === routes.login || value === routes.signup) return null;
  return value;
}

export function loginHref(next?: string | null): string {
  const path = safeNextPath(next);
  if (!path) return routes.login;
  return `${routes.login}?next=${encodeURIComponent(path)}`;
}

export function signupHref(next?: string | null): string {
  const path = safeNextPath(next);
  if (!path) return routes.signup;
  return `${routes.signup}?next=${encodeURIComponent(path)}`;
}

export function withNext(href: string, next?: string | null): string {
  const path = safeNextPath(next);
  if (!path) return href;
  const join = href.includes("?") ? "&" : "?";
  return `${href}${join}next=${encodeURIComponent(path)}`;
}
