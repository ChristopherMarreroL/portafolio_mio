import type { APIRoute } from "astro";
import { supabase } from "../lib/supabase";

const site = "https://elchrispuntocom.vercel.app";

const escapeXml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

export const GET: APIRoute = async () => {
  const { data, error } = await supabase
    .from("news_posts")
    .select("slug,updated_at,title_en,excerpt_en,content_en")
    .eq("published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error) {
    return new Response("Sitemap temporarily unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const fixedUrls = [
    { loc: `${site}/`, priority: "1.0", changefreq: "monthly" },
    { loc: `${site}/articulos`, priority: "0.8", changefreq: "weekly" },
    { loc: `${site}/articles`, priority: "0.8", changefreq: "weekly" },
  ];
  const articleUrls = (data ?? []).flatMap(({ slug, updated_at, title_en, excerpt_en, content_en }) => {
    const urls = [
      { loc: `${site}/articulos/${encodeURIComponent(slug)}`, lastmod: updated_at, priority: "0.7", changefreq: "monthly" },
    ];
    if (title_en && excerpt_en && content_en) {
      urls.push({ loc: `${site}/articles/${encodeURIComponent(slug)}`, lastmod: updated_at, priority: "0.7", changefreq: "monthly" });
    }
    return urls;
  });

  const entries = [...fixedUrls, ...articleUrls].map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
${url.lastmod ? `    <lastmod>${escapeXml(url.lastmod)}</lastmod>\n` : ""}    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
};
