import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    // The modules under test are pure: URL/registry resolution, search ranking
    // and the layout reducer. None of them need a DOM, and the one function
    // that touches window stubs it explicitly.
    environment: "node",
    include: ["src/**/*.test.ts", "app/**/*.test.ts", "lib/**/*.test.ts"],
  },
});
