import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Standalone investor pitch site — separate from the game app build. */
export default defineConfig({
  root: path.resolve(__dirname, "sites/investor"),
  publicDir: path.resolve(__dirname, "public"),
  base: process.env.VITE_INVESTOR_BASE_PATH || "/",
  server: {
    host: "::",
    port: 8081,
  },
  build: {
    outDir: path.resolve(__dirname, "dist-investor"),
    emptyOutDir: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@investor": path.resolve(__dirname, "sites/investor"),
    },
  },
});
