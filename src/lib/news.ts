import { supabase } from "./supabase";
import type { Lang, NewsPost } from "../types/content";

export async function getPublishedNewsPost(slug: string, lang: Lang) {
  const now = new Date().toISOString();
  let query = supabase
    .from("news_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .lte("published_at", now);

  if (lang === "en") {
    query = query.not("title_en", "is", null).not("excerpt_en", "is", null).not("content_en", "is", null);
  }

  const { data, error } = await query.maybeSingle();
  return {
    post: (data as NewsPost | null) ?? null,
    unavailable: Boolean(error),
  };
}
