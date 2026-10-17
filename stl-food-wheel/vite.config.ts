/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // WheelScene is lazy-loaded and is mostly three.js itself (~295 kB gzip); the warning adds no signal.
  build: {
    chunkSizeWarningLimit: 1100,
    // Flags must stay real URLs: inlined SVG data: URLs contain raw newlines/quotes that break CSS url().
    assetsInlineLimit: (file) => (file.includes("flag-icons") ? false : undefined),
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
