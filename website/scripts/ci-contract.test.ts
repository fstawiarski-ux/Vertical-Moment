// The point of `npm run verify:all` is that passing it locally means the same
// thing as the `test` check passing in CI. That only holds while the two lists
// are identical, and nothing else in the repository notices when they drift --
// a step added to .github/workflows/test.yml but not to scripts/verify-all.mjs
// silently becomes a check no developer or agent can run before pushing.
//
// These tests read the workflow as text rather than parsing YAML so the suite
// keeps its zero-dependency footprint.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fullSteps, repoRoot, reproduceHint, steps } from "./verify-all.mjs";

const workflowPath = path.join(repoRoot, ".github", "workflows", "test.yml");
const workflow = readFileSync(workflowPath, "utf8").replace(/\r\n/g, "\n");

// Steps that set the machine up rather than check anything. verify:all runs on
// a checkout that already has its dependencies, so it has no equivalent.
const setupCommands = new Set(["npm ci"]);

function runCommandsFromWorkflow(source: string): string[] {
  const commands: string[] = [];
  for (const match of source.matchAll(/^ {8}run: (.+)$/gm)) {
    const command = match[1].trim();
    if (!setupCommands.has(command)) commands.push(command);
  }
  return commands;
}

describe("verify:all mirrors the test workflow", () => {
  it("runs the same commands in the same order", () => {
    expect(runCommandsFromWorkflow(workflow)).toEqual(steps.map((step) => step.command));
  });

  it("keeps every step reproducible on its own", () => {
    for (const step of [...steps, ...fullSteps]) {
      expect(step.id, "step id").toMatch(/^[a-z0-9-]+$/);
      expect(step.title.length, `${step.id} title`).toBeGreaterThan(0);
      expect(["website", "repo"], `${step.id} cwd`).toContain(step.cwd);
    }
  });

  it("prints a PowerShell-safe reproduction command on Windows", () => {
    const hint = reproduceHint(steps[0], "win32");
    expect(hint).toContain("Set-Location -LiteralPath '");
    expect(hint).toContain("; npm run sync-data");
    expect(hint).not.toContain("&&");
  });

  it("prints a shell-safe reproduction command on non-Windows platforms", () => {
    const hint = reproduceHint(steps[0], "linux");
    expect(hint).toContain('cd "');
    expect(hint).toContain(" && npm run sync-data");
  });

  it("declares unique step ids across both plans", () => {
    const ids = [...steps, ...fullSteps].map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only depends on steps that run earlier", () => {
    const seen = new Set<string>();
    for (const step of steps) {
      for (const dependency of step.requires ?? []) expect(seen, `${step.id} requires ${dependency}`).toContain(dependency);
      seen.add(step.id);
    }
  });
});

describe("--full mirrors the other required branch-protection checks", () => {
  const contractWorkflow = readFileSync(path.join(repoRoot, ".github", "workflows", "repository-contract.yml"), "utf8");
  const dataWorkflow = readFileSync(path.join(repoRoot, ".github", "workflows", "validate-data.yml"), "utf8").replace(/\r\n/g, "\n");

  it("runs the same repository-contract script CI runs", () => {
    const scriptName = "verify-repository-contract.ps1";
    expect(contractWorkflow).toContain(scriptName);
    expect(fullSteps.find((step) => step.id === "contract")?.command).toContain(scriptName);
  });

  it("declares the tool a step needs so a missing tool reads as not run", () => {
    // Without this, "pwsh is not installed" and "the repository contract is
    // broken" both print FAIL and mean completely different things.
    expect(fullSteps.find((step) => step.id === "contract")?.requiresCommand).toBe("pwsh");
  });

  it("validates the same schema and data pairs validate-data.yml validates", () => {
    const schemas = [...dataWorkflow.matchAll(/-s (\S+)/g)].map((match) => match[1]);
    const covered = fullSteps.filter((step) => step.id.startsWith("validate-json")).map((step) => step.command);
    expect(schemas.length).toBeGreaterThan(0);
    for (const schema of schemas) expect(covered.some((command) => command.includes(schema)), `no --full step validates ${schema}`).toBe(true);
  });
});

describe("package scripts stay consistent with the orchestrator", () => {
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, "website", "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };

  it("exposes every npm script the default plan invokes", () => {
    for (const step of steps) {
      const scriptName = step.command.startsWith("npm run ") ? step.command.slice("npm run ".length) : null;
      if (scriptName) expect(Object.keys(pkg.scripts), `missing script ${scriptName}`).toContain(scriptName);
    }
  });

  it("does not ship a lint script that Next 16 cannot run", () => {
    // `next lint` was removed in Next 16. Left in place it does not report an
    // obsolete command -- it is parsed as `next <dir>` and fails with
    // "no such directory: .../website/lint", which sends the next reader
    // looking for a missing folder. See website/README.md.
    expect(pkg.scripts.lint ?? "").not.toContain("next lint");
  });
});
