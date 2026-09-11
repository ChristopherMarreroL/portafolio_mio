export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return "";

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}
