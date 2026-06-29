import { defineConfig } from "vite";

// base will be set to a repo-relative path when we deploy to a static host (Phase 6).
export default defineConfig({
  build: {
    target: "es2020",
  },
});
