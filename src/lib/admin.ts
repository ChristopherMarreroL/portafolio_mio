import { supabase } from "./supabase";

export const mediaBucket = "portfolio-media";

const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024;
const allowedMediaTypes = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Uint8Array) => bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte) },
  "image/webp": { extension: "webp", signature: (bytes: Uint8Array) => bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
  "application/pdf": { extension: "pdf", signature: (bytes: Uint8Array) => bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-" },
} satisfies Record<string, { extension: string; signature: (bytes: Uint8Array) => boolean }>;

export function validateHttpUrl(value: string) {
  if (!value) return "";

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("La URL no es valida.");
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("La URL debe usar http o https y no incluir credenciales.");
  }

  return value;
}

export function inputValue(id: string) {
  const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  const value = element?.value.trim() ?? "";
  return element instanceof HTMLInputElement && element.type === "url" ? validateHttpUrl(value) : value;
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
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
  el.className = type === "error" ? "text-sm text-red-500" : type === "success" ? "text-sm text-green-500" : "text-sm text-slate-500 dark:text-slate-400";
}

export function setFormSubmitting(form: HTMLFormElement | null, submitting: boolean) {
  if (!form) return;
  form.setAttribute("aria-busy", String(submitting));
  form.querySelectorAll<HTMLButtonElement>('button[type="submit"]').forEach((button) => {
    button.disabled = submitting;
  });
}

export function bindFileName(inputId: string, labelId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const label = document.getElementById(labelId);
  input?.addEventListener("change", () => {
    if (!label) return;
    const files = Array.from(input.files ?? []);
    label.textContent = files.length === 0
      ? "Ningun archivo seleccionado"
      : files.length === 1
        ? files[0].name
        : `${files.length} archivos seleccionados`;
  });
}

export function clearFileInput(inputId: string, labelId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const label = document.getElementById(labelId);
  if (input) input.value = "";
  if (label) label.textContent = "Ningun archivo seleccionado";
}

async function validateMedia(file: File) {
  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    throw new Error(`El archivo ${file.name} no puede superar 5 MB.`);
  }

  const mediaType = allowedMediaTypes[file.type as keyof typeof allowedMediaTypes];
  if (!mediaType) {
    throw new Error("Solo se permiten imágenes PNG, JPEG, WEBP o documentos PDF.");
  }

  const signatureBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!mediaType.signature(signatureBytes)) {
    throw new Error(`El contenido de ${file.name} no coincide con un formato permitido.`);
  }

  return mediaType;
}

function validateStorageFolder(folder: string) {
  if (!/^[a-z0-9-]+$/i.test(folder)) {
    throw new Error("La carpeta de destino no es valida.");
  }
}

async function uploadFile(file: File, folder: string) {
  const mediaType = await validateMedia(file);
  const fileName = `${folder}/${crypto.randomUUID()}.${mediaType.extension}`;
  const { error } = await supabase.storage.from(mediaBucket).upload(fileName, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(mediaBucket).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadImage(fileInputId: string, folder: string) {
  const fileInput = document.getElementById(fileInputId) as HTMLInputElement | null;
  const file = fileInput?.files?.[0];
  if (!file) return null;
  validateStorageFolder(folder);
  return uploadFile(file, folder);
}

export async function uploadImages(fileInputId: string, folder: string, maxFiles = 3) {
  const fileInput = document.getElementById(fileInputId) as HTMLInputElement | null;
  const files = Array.from(fileInput?.files ?? []);
  if (files.length === 0) return [];
  if (files.length > maxFiles) {
    throw new Error(`Solo puedes adjuntar ${maxFiles} archivos.`);
  }

  validateStorageFolder(folder);
  const uploadedUrls: string[] = [];
  try {
    for (const file of files) uploadedUrls.push(await uploadFile(file, folder));
    return uploadedUrls;
  } catch (error) {
    await removeStoredImages(uploadedUrls);
    throw error;
  }
}

export function storageObjectPath(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const supabaseHost = new URL(import.meta.env.PUBLIC_SUPABASE_URL).host;
    if (url.host !== supabaseHost) return null;
    const marker = `/storage/v1/object/public/${mediaBucket}/`;
    if (!url.pathname.startsWith(marker)) return null;
    const path = decodeURIComponent(url.pathname.slice(marker.length));
    if (!path || path.startsWith("/") || path.split("/").includes("..")) return null;
    return path;
  } catch {
    return null;
  }
}

export async function removeStoredImages(values: Array<string | null | undefined>) {
  const paths = [...new Set(values.map(storageObjectPath).filter((path): path is string => Boolean(path)))];
  if (paths.length === 0) return 0;
  const { error } = await supabase.storage.from(mediaBucket).remove(paths);
  if (error) throw error;
  return paths.length;
}

export async function removeStoredImage(value: string | null | undefined) {
  return removeStoredImages([value]);
}

export async function requireAdminSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    location.href = "/admin/login";
    return null;
  }

  const { data: isAdmin, error } = await supabase.rpc("is_portfolio_admin");
  if (error || isAdmin !== true) {
    await supabase.auth.signOut();
    location.href = "/admin/login";
    return null;
  }

  return data.session;
}
