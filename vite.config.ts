import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { version } from "./package.json";
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  build: { rollupOptions: { output: { manualChunks: { pdfjs: ["pdfjs-dist"] } } } },
  server: { host: "0.0.0.0", port: 5173, fs: { allow: ["."] } },
});
