import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// cryddd.github.io is a GitHub user-pages site served from the domain root,
// so the base must be "/". For a project page it would be "/<repo>/".
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
        },
      },
    },
  },
});
