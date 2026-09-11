import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const text = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("admin lists do not render database values through innerHTML", async () => {
  const files = await Promise.all([
    text("src/pages/admin/projects/index.astro"),
    text("src/pages/admin/credentials/index.astro"),
  ]);
  files.forEach((source) => assert.doesNotMatch(source, /\.innerHTML\s*=/));
});

test("Supabase mutations require the portfolio admin allowlist", async () => {
  const schema = await text("supabase/schema.sql");
  assert.match(schema, /create table if not exists public\.portfolio_admins/i);
  assert.match(schema, /create or replace function public\.is_portfolio_admin/i);
  assert.doesNotMatch(schema, /create policy "Authenticated can (?:create|update|delete)/i);
  assert.match(schema, /file_size_limit\s*=\s*excluded\.file_size_limit/i);
});

test("social preview is a 1200 by 630 PNG", async () => {
  const image = await readFile(new URL("../public/og-image.png", import.meta.url));
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

test("SEO discovery files expose one clean canonical route", async () => {
  const [robots, sitemap] = await Promise.all([
    text("public/robots.txt"),
    text("public/sitemap.xml"),
  ]);
  assert.doesNotMatch(robots, /Disallow:\s*\/admin/i);
  assert.match(robots, /Sitemap:\s*https:\/\/elchrispuntocom\.vercel\.app\/sitemap\.xml/i);
  assert.match(sitemap, /<loc>https:\/\/elchrispuntocom\.vercel\.app\/<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>[^<]+\/(?:es|en)\/<\/loc>/);
});

test("Vercel applies defensive browser headers", async () => {
  const config = JSON.parse(await text("vercel.json"));
  const globalHeaders = new Map(config.headers[0].headers.map(({ key, value }) => [key, value]));
  assert.match(globalHeaders.get("Content-Security-Policy"), /frame-ancestors 'none'/);
  assert.equal(globalHeaders.get("X-Frame-Options"), "DENY");
  assert.equal(globalHeaders.get("X-Content-Type-Options"), "nosniff");
});
