
 // Expense Tracker 2.0 — Phase 16 release verification
 // Run from the project root:
 //   node scripts/release-check.mjs
 //   node scripts/release-check.mjs --e2e

import { spawnSync } from "node:child_process";

const checks = [
  {
    name: "TypeScript",
    command: "npx",
    args: ["tsc", "--noEmit"],
  },
  {
    name: "ESLint",
    command: "npm",
    args: ["run", "lint"],
  },
  {
    name: "Unit tests",
    command: "npx",
    args: ["vitest", "run"],
  },
  {
    name: "Production build",
    command: "npm",
    args: ["run", "build"],
  },
];

// ==========================================
// OPTIONAL PLAYWRIGHT BROWSER TESTS
// ==========================================

if (process.argv.includes("--e2e")) {
  checks.push({
    name: "Desktop and mobile browser smoke tests",
    command: "npx",
    args: [
      "playwright",
      "test",
      "tests/e2e/release-smoke.spec.ts",
      "--workers=1",
      "--reporter=list",
    ],
  });
}

// ==========================================
// RUN EACH CHECK
// ==========================================

for (const check of checks) {
  console.log(
    `\n========== ${check.name} ==========`
  );

  const result = spawnSync(
    check.command,
    check.args,
    {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    }
  );

  if (result.error) {
    console.error(
      `Could not start ${check.name}: ${result.error.message}`
    );

    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(
      `\nFAILED: ${check.name} (exit status: ${result.status ?? "unknown"}).`
    );

    console.error(
      "Fix this failure before releasing the application."
    );

    process.exit(result.status || 1);
  }
}

// ==========================================
// SUCCESS
// ==========================================

console.log(
  "\nAll selected automated checks passed."
);

console.log(
  "Manual backup/recovery, privacy, and deployment checks are still required."
);
