// Deterministic repository-health orchestrator.
//
// This composes the checks that already exist; it does not re-implement any of
// them. The default step list is the exact command sequence of the `test` job
// in .github/workflows/test.yml, in the same order, so "green locally" and
// "green in CI" mean the same thing. scripts/ci-contract.test.ts fails if the
// two ever drift apart.
//
//   npm run verify:all                 the `test` check, offline, deterministic
//   npm run verify:all -- --full       also mirrors the `contract` and
//                                      `validate-json` required checks
//                                      (needs pwsh and network)
//   npm run verify:all -- --bail       stop at the first failure
//   npm run verify:all -- --json       write review-artifacts/repo-health.json
//   npm run verify:all -- --verbose    stream each step's output live
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const websiteRoot = path.resolve(here, "..");
export const repoRoot = path.resolve(websiteRoot, "..");

// `cwd: "website"` mirrors the workflow's `defaults.run.working-directory`.
// `cwd: "repo"` is for checks the workflow runs from the repository root.
export const steps = [
  { id: "sync-data", title: "Sync generated data mirror", command: "npm run sync-data", cwd: "website" },
  { id: "verify-data", title: "Verify data mirror", command: "npm run verify-data", cwd: "website", requires: ["sync-data"] },
  { id: "verify-canonical", title: "Verify canonical source chain", command: "npm run verify-canonical", cwd: "website", requires: ["sync-data"] },
  { id: "verify-pwa-content", title: "Verify PWA content registry", command: "npm run verify-pwa-content", cwd: "website", requires: ["sync-data"] },
  { id: "verify-security", title: "Verify public security boundaries", command: "npm run verify-security", cwd: "website", requires: ["sync-data"] },
  { id: "typecheck", title: "Typecheck", command: "npm run typecheck", cwd: "website", requires: ["sync-data"] },
  { id: "test", title: "Unit tests", command: "npm test", cwd: "website", requires: ["sync-data"] },
];

// Mirrors of the other two required branch-protection checks. They are opt-in
// because `contract` needs PowerShell 7 (`pwsh`) and `validate-json` downloads
// ajv-cli through npx, so neither is reliable on an offline developer machine.
export const fullSteps = [
  {
    id: "contract",
    title: "Validate repository product contract",
    command: "pwsh -NoProfile -File ./scripts/verify-repository-contract.ps1",
    cwd: "repo",
    requiresCommand: "pwsh",
    note: "needs PowerShell 7 (pwsh); Windows PowerShell 5.1 is not enough",
  },
  {
    id: "validate-json-routes",
    title: "Validate route records",
    command: 'npx --yes ajv-cli@5.0.0 validate --spec=draft2020 -s database/schemas/route.schema.json -d "database/json/routes/*.json"',
    cwd: "repo",
    note: "downloads ajv-cli through npx; needs network",
  },
  {
    id: "validate-json-master",
    title: "Validate Master v1 API export",
    command: "npx --yes ajv-cli@5.0.0 validate --spec=draft2020 -s database/schemas/master-api.schema.json -d database/generated/routes_v1.json",
    cwd: "repo",
    note: "downloads ajv-cli through npx; needs network",
  },
];

const OUTPUT_LINE_LIMIT = 200;
const CONSOLE_TAIL_LINES = 40;

export function parseArgs(argv) {
  const options = { full: false, bail: false, verbose: false, json: null, help: false };
  for (const arg of argv) {
    if (arg === "--full") options.full = true;
    else if (arg === "--bail") options.bail = true;
    else if (arg === "--verbose") options.verbose = true;
    else if (arg === "--json") options.json = "review-artifacts/repo-health.json";
    else if (arg.startsWith("--json=")) options.json = arg.slice("--json=".length);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`unknown option ${arg} (try --help)`);
  }
  return options;
}

function help() {
  console.log(`verify-all - deterministic repository health for Vertical Moment

  npm run verify:all [-- <options>]

  --full          also run the 'contract' and 'validate-json' required checks
                  (needs pwsh and network)
  --bail          stop at the first failing step
  --json[=path]   write a machine-readable result
                  (default review-artifacts/repo-health.json)
  --verbose       stream each step's output instead of capturing it
  -h, --help      show this message

The default step list is the command sequence of the 'test' job in
.github/workflows/test.yml. Exit code is 0 only when every planned step ran and
passed.`);
}

// A check the machine cannot run is reported as not run, never as passed and
// never as a repository failure -- "contract FAIL" and "pwsh is not installed"
// are different problems and should not read the same.
function commandExists(command) {
  const result = spawnSync(command, ["--version"], { encoding: "utf8", windowsHide: true });
  return !result.error;
}

function gitValue(args, fallback) {
  const result = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8", windowsHide: true });
  return result.status === 0 ? result.stdout.trim() : fallback;
}

function directoryFor(step) {
  return step.cwd === "repo" ? repoRoot : websiteRoot;
}

function quotePowerShellLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

export function reproduceHint(step, platform = process.platform) {
  const directory = directoryFor(step);
  if (platform === "win32") {
    return `Set-Location -LiteralPath ${quotePowerShellLiteral(directory)}; ${step.command}`;
  }
  return `cd ${JSON.stringify(directory)} && ${step.command}`;
}

function normalizeOutput(result) {
  const merged = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const lines = merged.replace(/\r\n/g, "\n").split("\n");
  while (lines.length && lines.at(-1).trim() === "") lines.pop();
  return lines;
}

function pad(text, width) {
  return text.length >= width ? text : text + " " + ".".repeat(Math.max(0, width - text.length - 1));
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`verify-all: ${error.message}`);
    process.exit(2);
  }
  if (options.help) {
    help();
    return;
  }

  const plan = options.full ? [...steps, ...fullSteps] : steps;
  const startedAt = new Date();
  const branch = gitValue(["branch", "--show-current"], "(unknown)");
  const head = gitValue(["rev-parse", "--short", "HEAD"], "(unknown)");

  console.log("Vertical Moment repository health");
  console.log(`  repository  ${repoRoot}`);
  console.log(`  branch      ${branch}`);
  console.log(`  head        ${head}`);
  console.log(`  node        ${process.version} on ${process.platform}`);
  console.log(`  mode        ${options.full ? "full (test + contract + validate-json)" : "default (test job only)"}`);
  console.log(`  started     ${startedAt.toISOString()}`);
  console.log("");

  const results = [];
  const failed = new Set();
  const labelWidth = Math.max(...plan.map((step) => step.id.length)) + 3;

  for (const [index, step] of plan.entries()) {
    const position = `[${String(index + 1).padStart(2)}/${plan.length}]`;
    const blockedBy = (step.requires ?? []).filter((id) => failed.has(id));
    if (blockedBy.length) {
      const reason = `prerequisite failed: ${blockedBy.join(", ")}`;
      console.log(`${position} ${pad(step.id, labelWidth)} SKIP  ${reason}`);
      results.push({ ...step, status: "skipped", reason, exitCode: null, durationMs: 0, output: [] });
      failed.add(step.id);
      continue;
    }

    if (step.requiresCommand && !commandExists(step.requiresCommand)) {
      const reason = `${step.requiresCommand} is not installed or not on PATH`;
      console.log(`${position} ${pad(step.id, labelWidth)} SKIP  ${reason}`);
      results.push({ ...step, status: "skipped", reason, exitCode: null, durationMs: 0, output: [] });
      continue;
    }

    const cwd = directoryFor(step);
    const label = `${position} ${pad(step.id, labelWidth)}`;
    let result;
    const startedStep = Date.now();
    if (options.verbose) {
      console.log(`${label} RUN`);
      result = spawnSync(step.command, { cwd, shell: true, stdio: "inherit", windowsHide: true });
    } else {
      process.stdout.write(`${label} `);
      result = spawnSync(step.command, { cwd, shell: true, encoding: "utf8", windowsHide: true });
    }
    const durationMs = Date.now() - startedStep;
    const output = options.verbose ? [] : normalizeOutput(result);
    const exitCode = result.status;
    const ok = exitCode === 0;
    const verdict = `${ok ? "PASS" : "FAIL"}  ${(durationMs / 1000).toFixed(1)}s`;
    console.log(options.verbose ? `${label} ${verdict}` : verdict);

    results.push({
      ...step,
      status: ok ? "passed" : "failed",
      reason: ok ? null : (result.error?.message ?? null),
      exitCode,
      durationMs,
      output: output.slice(-OUTPUT_LINE_LIMIT),
    });

    if (!ok) {
      failed.add(step.id);
      if (options.bail) {
        for (const remaining of plan.slice(index + 1)) {
          results.push({ ...remaining, status: "skipped", reason: "--bail after first failure", exitCode: null, durationMs: 0, output: [] });
        }
        break;
      }
    }
  }

  const failures = results.filter((step) => step.status === "failed");
  for (const step of results.filter((entry) => entry.status === "skipped" && entry.requiresCommand)) {
    console.log("");
    console.log(`NOT RUN  ${step.id}  (${step.title})`);
    console.log(`  reason       ${step.reason}`);
    if (step.note) console.log(`  note         ${step.note}`);
    console.log(`  reproduce    ${reproduceHint(step)}`);
    console.log("  this check was not performed; CI still runs it");
  }
  console.log("");
  for (const step of failures) {
    console.log("-".repeat(72));
    console.log(`FAILED  ${step.id}  (${step.title})`);
    console.log(`  command      ${step.command}`);
    console.log(`  working dir  ${directoryFor(step)}`);
    console.log(`  exit code    ${step.exitCode ?? "(process did not start)"}`);
    if (step.reason) console.log(`  spawn error  ${step.reason}`);
    if (step.note) console.log(`  note         ${step.note}`);
    console.log(`  reproduce    ${reproduceHint(step)}`);
    if (step.output.length) {
      console.log("  last output:");
      for (const outputLine of step.output.slice(-CONSOLE_TAIL_LINES)) console.log(`    | ${outputLine}`);
    } else {
      console.log("  last output: (none captured; re-run this step on its own)");
    }
    console.log("-".repeat(72));
    console.log("");
  }

  const totals = {
    total: results.length,
    passed: results.filter((step) => step.status === "passed").length,
    failed: failures.length,
    skipped: results.filter((step) => step.status === "skipped").length,
  };
  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const ok = totals.failed === 0 && totals.skipped === 0;

  console.log(`Summary  ${totals.passed} passed, ${totals.failed} failed, ${totals.skipped} skipped  (${(durationMs / 1000).toFixed(1)}s)`);
  if (!ok) {
    const names = [
      ...failures.map((step) => step.id),
      ...results.filter((step) => step.status === "skipped").map((step) => `${step.id} (skipped)`),
    ];
    console.log(`Unhealthy: ${names.join(", ")}`);
  }
  console.log(`repository health: ${ok ? "PASS" : "FAIL"}`);

  if (options.json) {
    const target = path.isAbsolute(options.json) ? options.json : path.join(websiteRoot, options.json);
    const document = {
      schemaVersion: 1,
      tool: "verify-all",
      ok,
      mode: options.full ? "full" : "default",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs,
      repository: { root: repoRoot, branch, head },
      environment: { node: process.version, platform: process.platform, arch: process.arch },
      totals,
      steps: results.map((step) => ({
        id: step.id,
        title: step.title,
        command: step.command,
        cwd: directoryFor(step),
        status: step.status,
        exitCode: step.exitCode,
        durationMs: step.durationMs,
        reason: step.reason ?? null,
        reproduce: reproduceHint(step),
        output: step.output,
      })),
    };
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(document, null, 2)}\n`, "utf8");
    console.log(`machine-readable result: ${target}`);
  }

  process.exitCode = ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
