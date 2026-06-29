import { defineConfig } from "vite";

// For GitHub Pages project sites the app is served from /<repo>/, so the production build needs a
// matching base. Dev keeps "/". If you rename the repo, update REPO_BASE to match.
const REPO_BASE = "/free-flying-birds/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? REPO_BASE : "/",
  build: {
    target: "es2020",
  },
}));
