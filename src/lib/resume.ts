import type { SupabaseClient } from "@supabase/supabase-js";

export const resumeBucket = "portfolio-resume";
export const resumePath = "cv.pdf";
const maxResumeBytes = 5 * 1024 * 1024;

export async function validateResume(file: File) {
  if (!file.name.toLowerCase().endsWith(".pdf") || file.type !== "application/pdf") {
    throw new Error("El currículum debe ser un archivo PDF.");
  }
  if (file.size > maxResumeBytes) throw new Error("El PDF no puede superar 5 MB.");
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...signature) !== "%PDF-") {
    throw new Error("El archivo seleccionado no contiene un PDF válido.");
  }
}

export async function getResume(client: SupabaseClient) {
  const bucket = client.storage.from(resumeBucket);
  const { data, error } = await bucket.list("", { search: resumePath, limit: 10 });
  if (error) throw error;
  const file = data?.find((item) => item.name === resumePath);
  if (!file) return null;

  const { data: publicData } = bucket.getPublicUrl(resumePath);
  const view = new URL(publicData.publicUrl);
  // A new version in the URL prevents browsers/CDNs from reusing the previous CV.
  view.searchParams.set("v", file.updated_at || file.id || resumePath);
  const download = new URL(view);
  download.searchParams.set("download", "Christopher-CV.pdf");
  return { viewUrl: view.href, downloadUrl: download.href };
}

export async function saveResume(client: SupabaseClient, file: File) {
  await validateResume(file);
  // One object only: replacement overwrites the current PDF without deleting it first.
  // Failed validation/uploads therefore leave the existing CV available.
  const { error } = await client.storage.from(resumeBucket).upload(resumePath, file, {
    upsert: true,
    contentType: "application/pdf",
    cacheControl: "0",
  });
  if (error) throw error;
}

export async function deleteResume(client: SupabaseClient) {
  const { error } = await client.storage.from(resumeBucket).remove([resumePath]);
  if (error) throw error;
}
