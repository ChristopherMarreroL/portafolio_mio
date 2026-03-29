import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  site: "https://elchrispuntocom.vercel.app",
  vite: {
    plugins: [tailwind()],
  },
});
