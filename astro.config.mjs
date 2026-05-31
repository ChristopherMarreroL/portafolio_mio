import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://elchrispuntocom.vercel.app",
  output: "server",
  adapter: vercel(),
  vite: {
    plugins: [tailwind()],
  },
});
