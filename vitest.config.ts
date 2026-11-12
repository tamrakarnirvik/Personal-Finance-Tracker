
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },

  test: {
    // Run only unit tests with Vitest.
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],

    environment: "node",
  },
});
