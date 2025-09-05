// node scripts/build-abis.mjs
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve repo root regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

// Resolve artifacts dir absolutely; allow override via env
const ART_OUT = process.env.CONTRACTS_OUT ||
  path.join(repoRoot, "packages", "contracts", "out");

// Where we write the ABI package files
const ABI_PKG_DIR = path.join(repoRoot, "packages", "abi");
const TARGETS = [
  {
    // Try V5 first; if not present, fall back to V4
    candidates: [
      ["MawSacrificeV5Caps.sol", "MawSacrificeV5Caps.json"],
      ["MawSacrificeV4NoTimelock.sol", "MawSacrificeV4NoTimelock.json"],
    ],
    out: path.join(ABI_PKG_DIR, "maw.json"),
  },
  {
    candidates: [["Relics.sol", "Relics.json"]],
    out: path.join(ABI_PKG_DIR, "relics.json"),
  },
  {
    candidates: [["CosmeticsV2.sol", "CosmeticsV2.json"]],
    out: path.join(ABI_PKG_DIR, "cosmetics.json"),
  },
];

// Wait until a file exists (handles slow FS or another process writing)
async function waitForFile(p, { timeoutMs = 15000, pollMs = 150 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await fs.access(p);
      return true;
    } catch {
      if (Date.now() - start > timeoutMs) return false;
      await new Promise(r => setTimeout(r, pollMs));
    }
  }
}

function normalizeAbi(abi) {
  // Ensure deterministic order for stable diffs
  return [...abi].sort((a, b) => {
    const ak = `${a.type}:${a.name || ""}`;
    const bk = `${b.type}:${b.name || ""}`;
    return ak.localeCompare(bk);
  });
}

async function readArtifactAbi(solName, jsonName) {
  const p = path.join(ART_OUT, solName, jsonName);
  const ok = await waitForFile(p);
  if (!ok) return null;
  const raw = await fs.readFile(p, "utf8");
  const art = JSON.parse(raw);
  if (!art.abi) throw new Error(`No ABI in artifact: ${p}`);
  return normalizeAbi(art.abi);
}

async function ensureDir(p) {
  if (!fssync.existsSync(p)) await fs.mkdir(p, { recursive: true });
}

async function writeJsonAtomic(p, data) {
  await ensureDir(path.dirname(p));
  const tmp = `${p}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, p); // atomic swap on most filesystems
}

async function main() {
  console.log("Building ABIs from Foundry artifacts...");
  
  // Sanity: contracts/out exists
  if (!fssync.existsSync(ART_OUT)) {
    throw new Error(`Artifacts dir not found: ${ART_OUT} (cwd: ${process.cwd()})`);
  }

  for (const t of TARGETS) {
    let abi = null;
    for (const [sol, json] of t.candidates) {
      abi = await readArtifactAbi(sol, json);
      if (abi) {
        console.log(`✅ Using ABI from ${path.join(sol, json)}`);
        break;
      } else {
        console.log(`… not found yet: ${path.join(sol, json)} (will try next candidate)`);
      }
    }
    if (!abi) {
      const tried = t.candidates.map(c => c.join("/")).join(", ");
      throw new Error(`Artifact missing: tried [${tried}] in ${ART_OUT}. Did you run 'forge build'?`);
    }
    await writeJsonAtomic(t.out, abi);
    console.log(`💾 Wrote ${path.relative(repoRoot, t.out)}`);
  }
  
  console.log("\n✅ ABI extraction complete!");
}

main().catch(err => {
  console.error("❌ build-abis failed:", err);
  process.exit(1);
});