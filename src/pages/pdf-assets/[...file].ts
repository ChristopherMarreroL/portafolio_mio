import type { APIRoute, GetStaticPaths } from "astro";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

export const prerender = true;
const packageRoot = dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json"));
const folders = ["cmaps", "standard_fonts", "wasm"];

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await Promise.all(folders.map(async (folder) => {
    const files = await readdir(join(packageRoot, folder), { withFileTypes: true });
    return files.filter((file) => file.isFile()).map((file) => ({ params: { file: `${folder}/${file.name}` } }));
  }));
  return paths.flat();
};

export const GET: APIRoute = async ({ params }) => {
  const [folder, file, ...rest] = (params.file || "").split("/");
  if (!folders.includes(folder) || !file || rest.length || !/^[a-zA-Z0-9_.-]+$/.test(file) || file.startsWith(".")) {
    return new Response(null, { status: 404 });
  }
  try {
    const bytes = await readFile(join(packageRoot, folder, file));
    const contentType = file.endsWith(".wasm") ? "application/wasm" : file.endsWith(".js") ? "text/javascript" : "application/octet-stream";
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": contentType } });
  } catch {
    return new Response(null, { status: 404 });
  }
};