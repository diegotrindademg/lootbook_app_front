import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests only (`npm test`); the screens are checked in the browser with the dev fakes.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
