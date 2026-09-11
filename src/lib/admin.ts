import { supabase } from "./supabase";

export const mediaBucket = "portfolio-media";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Uint8Array) => bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte) },
  "image/webp": { extension: "webp", signature: (bytes: Uint8Array) => bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
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
    if (label) label.textContent = input.files?.[0]?.name || "Ningun archivo seleccionado";
  });
}

export async function uploadImage(fileInputId: string, folder: string) {
  const fileInput = document.getElementById(fileInputId) as HTMLInputElement | null;
  const file = fileInput?.files?.[0];
  if (!file) return null;

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("La imagen no puede superar 5 MB.");
  }

  const imageType = allowedImageTypes[file.type as keyof typeof allowedImageTypes];
  if (!imageType) {
    throw new Error("Solo se permiten imagenes PNG, JPEG o WEBP.");
  }

  const signatureBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!imageType.signature(signatureBytes)) {
    throw new Error("El contenido del archivo no coincide con un formato de imagen permitido.");
  }

  if (!/^[a-z0-9-]+$/i.test(folder)) {
    throw new Error("La carpeta de destino no es valida.");
  }

  const fileName = `${folder}/${crypto.randomUUID()}.${imageType.extension}`;
  const { error } = await supabase.storage.from(mediaBucket).upload(fileName, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(mediaBucket).getPublicUrl(fileName);
  return data.publicUrl;
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
