import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The modules under test are pure: URL/registry resolution, search ranking
    // and the layout reducer. None of them need a DOM, and the one function
    // that touches window stubs it explicitly.
    environment: "node",
    // scripts/ covers the verification scripts themselves: the CI/local
    // drift guard and the fixture tests that prove each verify-* script still
    // rejects the inputs it exists to reject.
    include: ["src/**/*.test.ts", "app/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
