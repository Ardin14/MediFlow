import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";
import { File as UndiciFile } from "undici";

// Polyfill Web File in Node environments that lack it (e.g., Node < 20)
// Some plugins may rely on globalThis.File during config evaluation.
// Undici provides a compatible implementation.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any;
if (typeof g.File === "undefined" && typeof UndiciFile !== "undefined") {
  g.File = UndiciFile as unknown as typeof File;
}

export default defineConfig({
  plugins: [...mochaPlugins(process.env as any), react(), cloudflare()],
  server: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
