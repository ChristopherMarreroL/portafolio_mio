import type { APIRoute } from "astro";

const supportedLanguages = new Set(["es", "en"]);

export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.formData();
  const language = formData.get("lang");

  if (typeof language !== "string" || !supportedLanguages.has(language)) {
    return new Response("Unsupported language", { status: 400 });
  }

  cookies.set("lang", language, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });

  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
    },
  });
};
