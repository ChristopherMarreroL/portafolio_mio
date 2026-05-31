import { supabase } from "./supabase";

export const mediaBucket = "portfolio-media";

export function inputValue(id: string) {
  return (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)?.value.trim() ?? "";
}

export function checkedValue(id: string) {
  return Boolean((document.getElementById(id) as HTMLInputElement | null)?.checked);
}

export function setValue(id: string, value: unknown) {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  if (el) el.value = value == null ? "" : String(value);
}

export function setChecked(id: string, value: boolean) {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) el.checked = value;
}

export function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function listToInput(value: string[] | null | undefined) {
  return (value ?? []).join(", ");
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function showMessage(id: string, text: string, type: "info" | "success" | "error" = "info") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = type === "error" ? "text-sm text-red-500" : type === "success" ? "text-sm text-green-500" : "text-sm text-slate-500 dark:text-slate-400";
}

export function bindFileName(inputId: string, labelId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const label = document.getElementById(labelId);
  input?.addEventListener("change", () => {
    if (label) label.textContent = input.files?.[0]?.name || "Ningun archivo seleccionado";
  });
}

export async function uploadImage(fileInputId: string, folder: string) {
  const fileInput = document.getElementById(fileInputId) as HTMLInputElement | null;
  const file = fileInput?.files?.[0];
  if (!file) return null;

  const ext = file.name.split(".").pop() || "webp";
  const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(mediaBucket).upload(fileName, file, { upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(mediaBucket).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function requireAdminSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) location.href = "/admin/login";
  return data.session;
}
