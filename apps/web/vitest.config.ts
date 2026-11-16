import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Shared web test config. Tests live next to their code as *.test.ts(x).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
