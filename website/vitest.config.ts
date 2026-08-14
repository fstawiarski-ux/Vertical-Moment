import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The modules under test are pure: URL/registry resolution, search ranking
    // and the layout reducer. None of them need a DOM, and the one function
    // that touches window stubs it explicitly.
    environment: "node",
    include: ["src/**/*.test.ts", "app/**/*.test.ts"],
  },
});
