export function slugifyUsername(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

export function randomUsername(seed?: string): string {
  const base = slugifyUsername(seed || "") || "user";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base.slice(0, 15)}_${suffix}`.slice(0, 24);
}

