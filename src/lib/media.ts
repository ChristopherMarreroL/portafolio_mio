export function isPdfUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    return decodeURIComponent(new URL(value, "https://portfolio.local").pathname).toLowerCase().endsWith(".pdf");
  } catch {
    return value.split(/[?#]/, 1)[0].toLowerCase().endsWith(".pdf");
  }
}

export function isEmbeddablePdfUrl(value: string | null | undefined) {
  if (!isPdfUrl(value) || !value || !import.meta.env.PUBLIC_SUPABASE_URL) return false;
  try {
    const url = new URL(value);
    const supabaseUrl = new URL(import.meta.env.PUBLIC_SUPABASE_URL);
    const path = decodeURIComponent(url.pathname);
    return url.protocol === "https:"
      && url.host === supabaseUrl.host
      && path.startsWith("/storage/v1/object/public/portfolio-media/")
      && !path.split("/").includes("..");
  } catch {
    return false;
  }
}
