import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // tsconfig's `jsx: "preserve"` is for Next; compile JSX with the automatic
  // runtime here so component tests (e.g. tool-article.test.ts) can render.
  esbuild: { jsx: "automatic" },
  test: {
    // Conversion logic is pure — no DOM needed.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
