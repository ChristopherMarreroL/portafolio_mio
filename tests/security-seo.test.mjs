import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const text = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("admin lists do not render database values through innerHTML", async () => {
  const files = await Promise.all([
    text("src/pages/admin/projects/index.astro"),
    text("src/pages/admin/credentials/index.astro"),
    text("src/pages/admin/news/index.astro"),
  ]);
  files.forEach((source) => assert.doesNotMatch(source, /\.innerHTML\s*=/));
});

test("Supabase mutations require the portfolio admin allowlist", async () => {
  const schema = await text("supabase/schema.sql");
  assert.match(schema, /create table if not exists public\.portfolio_admins/i);
  assert.match(schema, /create or replace function public\.is_portfolio_admin/i);
  assert.doesNotMatch(schema, /select count\(\*\) from auth\.users/i);
  assert.doesNotMatch(schema, /create policy "Authenticated can (?:create|update|delete)/i);
  assert.match(schema, /file_size_limit\s*=\s*excluded\.file_size_limit/i);
  assert.match(schema, /create table if not exists public\.news_posts/i);
  assert.match(schema, /Public can read published news/i);
  assert.match(schema, /news_posts_max_three_images/i);
  assert.match(schema, /Portfolio admins can read portfolio media metadata/i);
});

test("JSON-LD escapes values that could close the script element", async () => {
  const layout = await text("src/layouts/BaseLayout.astro");
  assert.match(layout, /replace\(\/<\/g, "\\\\u003c"\)/);
  assert.match(layout, /set:html=\{serializedStructuredData\}/);
  assert.doesNotMatch(layout, /set:html=\{JSON\.stringify\(structuredData\)\}/);
});

test("admin image flows clean Storage and cap news galleries at three images", async () => {
  const [adminHelpers, newsForm, projectEdit, credentialEdit, projectList, credentialList, newsList] = await Promise.all([
    text("src/lib/admin.ts"),
    text("src/components/admin/NewsForm.astro"),
    text("src/pages/admin/projects/edit/[id].astro"),
    text("src/pages/admin/credentials/edit/[id].astro"),
    text("src/pages/admin/projects/index.astro"),
    text("src/pages/admin/credentials/index.astro"),
    text("src/pages/admin/news/index.astro"),
  ]);
  assert.match(adminHelpers, /export async function removeStoredImages/);
  assert.match(adminHelpers, /export async function uploadImages/);
  assert.match(newsForm, /multiple/);
  assert.match(newsForm, /3 - baseImages\.length/);
  assert.match(newsForm, /Eliminar imagen/);
  assert.match(newsForm, /type="date"/);
  assert.match(newsForm, /Selecciona la fecha de publicación en el calendario/);
  assert.match(newsForm, /Completa el título, resumen y contenido en inglés antes de publicar/);
  assert.match(projectEdit, /removeStoredImage\(previousUrl\)/);
  assert.match(credentialEdit, /removeStoredImage\(previousUrl\)/);
  [projectList, credentialList, newsList].forEach((source) => assert.match(source, /removeStoredImages/));
});

test("social preview is a 1200 by 630 PNG", async () => {
  const image = await readFile(new URL("../public/og-image.png", import.meta.url));
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

test("SEO discovery exposes the portfolio and bilingual article routes", async () => {
  const [robots, sitemap, spanishArticleRoute, englishArticleRoute] = await Promise.all([
    text("public/robots.txt"),
    text("src/pages/sitemap.xml.ts"),
    text("src/pages/articulos/[slug].astro"),
    text("src/pages/articles/[slug].astro"),
  ]);
  assert.doesNotMatch(robots, /Disallow:\s*\/admin/i);
  assert.match(robots, /Sitemap:\s*https:\/\/elchrispuntocom\.vercel\.app\/sitemap\.xml/i);
  assert.match(sitemap, /elchrispuntocom\.vercel\.app/);
  assert.match(sitemap, /articulos/);
  assert.match(sitemap, /articles/);
  assert.doesNotMatch(sitemap, /novedades/);
  assert.doesNotMatch(sitemap, /updates/);
  [spanishArticleRoute, englishArticleRoute].forEach((source) => {
    assert.match(source, /Astro\.response\.status\s*=\s*unavailable \? 503 : post \? 200 : 404/);
  });
});

test("Vercel applies defensive browser headers", async () => {
  const config = JSON.parse(await text("vercel.json"));
  const globalHeaders = new Map(config.headers[0].headers.map(({ key, value }) => [key, value]));
  assert.match(globalHeaders.get("Content-Security-Policy"), /frame-ancestors 'none'/);
  assert.equal(globalHeaders.get("X-Frame-Options"), "DENY");
  assert.equal(globalHeaders.get("X-Content-Type-Options"), "nosniff");
});
