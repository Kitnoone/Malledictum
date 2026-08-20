import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative paths keep the application working under any GitHub repository name.
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
