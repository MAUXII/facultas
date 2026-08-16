export const PUBLIC_ID_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export const PUBLIC_ID_LENGTH = 8;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createPublicId(size = PUBLIC_ID_LENGTH) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) {
    out += PUBLIC_ID_ALPHABET[byte % PUBLIC_ID_ALPHABET.length];
  }
  return out;
}

export function isPublicId(value: string) {
  return (
    value.length === PUBLIC_ID_LENGTH &&
    [...value].every((ch) => PUBLIC_ID_ALPHABET.includes(ch))
  );
}

export function isUuid(value: string) {
  return UUID.test(value);
}
