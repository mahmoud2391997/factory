import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8")) as T;

type PackageManifest = {
  packageManager?: string;
  workspaces?: unknown;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
};

function findFilesNamed(directory: string, fileName: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name === "node_modules") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...findFilesNamed(fullPath, fileName));
    else if (entry.isFile() && entry.name === fileName) results.push(fullPath);
  }
  return results;
}

test("root package manifest uses the required pnpm workspace scripts", () => {
  const root = readJson<PackageManifest>("package.json");
  assert.equal(root.packageManager, "pnpm@10.12.4");
  assert.equal(root.workspaces, undefined, "pnpm-workspace.yaml is the workspace source of truth");

  const scripts = root.scripts ?? {};
  for (const name of ["dev", "build", "build:web", "test", "test:erp", "lint", "typecheck", "start"]) {
    assert.ok(scripts[name]?.trim(), `root script ${name} must be defined`);
  }
  assert.equal(scripts["test:smoke"], "node scripts/smoke-test.mjs");
  assert.equal(scripts["vercel-build"], "bash scripts/vercel-build.sh");
  assert.equal(scripts["db:deploy"], "pnpm --filter @erp/database migrate:deploy");
});

test("pnpm workspace and package manifests retain the expected deployment configuration", () => {
  const workspace = readFileSync(path.join(repoRoot, "pnpm-workspace.yaml"), "utf8");
  assert.match(workspace, /packages:\s*\n\s*-\s*apps\/\*\s*\n\s*-\s*packages\/\*/);
  for (const dependency of ["'@prisma/client'", "'@prisma/engines'", "prisma", "esbuild", "bcryptjs"]) {
    assert.match(workspace, new RegExp(`^\\s*-\\s*${dependency.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*$`, "m"));
  }

  const web = readJson<PackageManifest>("apps/web/package.json");
  const root = readJson<PackageManifest>("package.json");
  assert.equal(root.dependencies?.next, web.dependencies?.next, "Vercel framework detection at the repository root must match the web app's Next.js version");
  assert.equal(web.dependencies?.["@erp/database"], "workspace:*");
  const start = web.scripts?.start ?? "";
  assert.equal(start, "next start", "Vercel production start must use Next.js defaults, not Docker host/port flags");
  assert.doesNotMatch(start, /docker|--network|--publish/i, "web start must not depend on Docker flags");

  const database = readJson<PackageManifest>("packages/database/package.json");
  assert.equal(database.scripts?.generate, "prisma generate");
  assert.doesNotMatch(database.scripts?.generate ?? "", /DATABASE_URL\s*(?:\|\||\?\?|=)/i);
});

test("Next.js config has the required headers and Vercel build stamp without standalone output", () => {
  const nextConfig = readFileSync(path.join(repoRoot, "apps/web/next.config.mjs"), "utf8");
  assert.match(nextConfig, /X-Frame-Options/);
  assert.match(nextConfig, /SAMEORIGIN/);
  assert.match(nextConfig, /X-Content-Type-Options/);
  assert.match(nextConfig, /nosniff/);
  assert.match(nextConfig, /Referrer-Policy/);
  assert.match(nextConfig, /poweredByHeader:\s*false/);
  assert.match(nextConfig, /VERCEL_GIT_COMMIT_SHA/);
  assert.doesNotMatch(nextConfig, /output:\s*['"]standalone['"]/);
});

test("exactly one Vercel config delegates builds to the root script, and the pnpm lockfile exists", () => {
  const vercelConfigs = findFilesNamed(repoRoot, "vercel.json");
  assert.equal(vercelConfigs.length, 1, `expected one vercel.json, found: ${vercelConfigs.join(", ")}`);
  const vercel = JSON.parse(readFileSync(vercelConfigs[0], "utf8")) as { buildCommand?: string; rootDirectory?: string };
  assert.equal(vercel.rootDirectory, undefined, "Root Directory belongs in Vercel project settings, not vercel.json");
  const rootScripts = readJson<PackageManifest>("package.json").scripts ?? {};
  const rootScriptName = (vercel.buildCommand ?? "").match(/^pnpm\s+([\w:-]+)$/)?.[1];
  assert.ok(rootScriptName, `Vercel buildCommand must invoke a root pnpm script, got: ${vercel.buildCommand}`);
  assert.equal(rootScripts[rootScriptName], "bash scripts/vercel-build.sh");
  assert.ok(existsSync(path.join(repoRoot, "pnpm-lock.yaml")), "pnpm-lock.yaml must exist");
});
