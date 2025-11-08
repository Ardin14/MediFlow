import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// Polyfill Web File in Node environments that lack it (e.g., Node < 20)
// Do this BEFORE importing any plugins that might import undici/fetch internally.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any;
if (typeof g.File === "undefined") {
  class NodeFile {
    name: string;
    lastModified: number;
    size: number;
    type: string;
    private _parts: any[];
    constructor(bits: any[], name: string, options: any = {}) {
      this._parts = bits || [];
      this.name = String(name);
      this.lastModified = options?.lastModified ?? Date.now();
      this.type = options?.type ?? "";
      this.size = this._parts.reduce((n, part) => {
        if (typeof part === 'string') return n + Buffer.byteLength(part);
        if (part && typeof part === 'object' && typeof part.size === 'number') return n + part.size;
        return n;
      }, 0);
    }
  }
  g.File = NodeFile as unknown as typeof File;
}

// Import mocha plugins AFTER the polyfill so they can rely on global File
import { mochaPlugins } from "@getmocha/vite-plugins";

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
