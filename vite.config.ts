import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative paths keep the application working under any GitHub repository name.
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // The repository-root index.html is the ready GitHub Pages build.
      // Source builds use this separate entry and still emit dist/index.html.
      input: { index: "index.source.html" },
    },
  },
});
