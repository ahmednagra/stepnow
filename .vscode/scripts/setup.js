// .vscode/scripts/setup.js
// -----------------------------------------------------------------------------
// One-shot pre-launch setup. Runs before the dev servers start (see launch.json
// preLaunchTask → tasks.json → this file).
//
// Why a separate .js file instead of `node -e "..."` inline in tasks.json?
// PowerShell on Windows mangles inline quotes — single quotes inside the JS get
// stripped, producing `require()` with empty args and a SyntaxError. Reading
// from a file sidesteps the shell-quoting layer entirely.
//
// What this does (all idempotent — safe to run every launch):
//   1. Copies apps/backend/.env.example  → apps/backend/.env       if missing
//   2. Copies apps/frontend/.env.example → apps/frontend/.env.local if missing
//   3. Runs `npm install` in apps/frontend if node_modules is missing
//
// Python deps are NOT installed here — tasks.json runs `python -m pip install`
// directly because that's a single command with no quoting hazard.
// -----------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Resolve paths relative to the workspace root, not the cwd of whoever launched
// us. __dirname is .vscode/scripts/, so the workspace root is two levels up.
const ROOT = path.resolve(__dirname, "..", "..");

function log(msg) {
  console.log(`[setup] ${msg}`);
}

function ensureEnvFile(target, source, hintOnCreate) {
  const targetAbs = path.join(ROOT, target);
  const sourceAbs = path.join(ROOT, source);

  if (fs.existsSync(targetAbs)) {
    log(`${target} already exists — OK`);
    return;
  }
  if (!fs.existsSync(sourceAbs)) {
    log(`WARNING: neither ${target} nor ${source} exists — skipping`);
    return;
  }
  fs.copyFileSync(sourceAbs, targetAbs);
  log(`created ${target} from ${path.basename(source)}`);
  if (hintOnCreate) {
    log(`  → ${hintOnCreate}`);
  }
}

function ensureNodeModules() {
  const nm = path.join(ROOT, "apps", "frontend", "node_modules");
  if (fs.existsSync(nm)) {
    log("apps/frontend/node_modules already exists — OK");
    return;
  }
  log("node_modules missing — running `npm install` (first run takes 1-2 min)");
  execSync("npm install", {
    cwd: path.join(ROOT, "apps", "frontend"),
    stdio: "inherit",
  });
}

try {
  ensureEnvFile(
    "apps/backend/.env",
    "apps/backend/.env.example",
    "fill in DATABASE_URL, JWT_SECRET_KEY, EMAIL_API_KEY before the backend will start",
  );
  ensureEnvFile("apps/frontend/.env.local", "apps/frontend/.env.example");
  ensureNodeModules();
  log("setup complete");
} catch (err) {
  console.error("[setup] FAILED:", err.message);
  process.exit(1);
}
