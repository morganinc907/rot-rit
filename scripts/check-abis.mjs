import fs from "node:fs";
import crypto from "node:crypto";

function hash(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

console.log("Checking ABI integrity...");

// Read compiled ABIs from the package
const compiledMaw = JSON.parse(fs.readFileSync("packages/abi/maw.json", "utf8"));
const compiledRelics = JSON.parse(fs.readFileSync("packages/abi/relics.json", "utf8"));
const compiledCosmetics = JSON.parse(fs.readFileSync("packages/abi/cosmetics.json", "utf8"));

// Ensure ABIs aren't empty
if (!compiledMaw.length || !compiledRelics.length || !compiledCosmetics.length) {
  throw new Error("Empty ABI(s) — did you run forge build + build-abis?");
}

// Check for critical functions in MAW contract
const mawFunctions = compiledMaw
  .filter(x => x.type === "function")
  .map(x => x.name);

const requiredMawFunctions = ["sacrificeForCosmetic", "sacrificeKeys", "convertShardsToRustedCaps", "sacrificesPaused"];
const missingMaw = requiredMawFunctions.filter(fn => !mawFunctions.includes(fn));

if (missingMaw.length > 0) {
  throw new Error(`MAW ABI missing critical functions: ${missingMaw.join(", ")}`);
}

// Check for critical functions in Relics contract
const relicsFunctions = compiledRelics
  .filter(x => x.type === "function")
  .map(x => x.name);

const requiredRelicsFunctions = ["mint", "burn", "burnBatch", "balanceOf", "balanceOfBatch"];
const missingRelics = requiredRelicsFunctions.filter(fn => !relicsFunctions.includes(fn));

if (missingRelics.length > 0) {
  throw new Error(`Relics ABI missing critical functions: ${missingRelics.join(", ")}`);
}

// Check for critical functions in Cosmetics contract
const cosmeticsFunctions = compiledCosmetics
  .filter(x => x.type === "function")
  .map(x => x.name);

const requiredCosmeticsFunctions = ["mintTo", "getCosmeticInfo", "createCosmeticType"];
const missingCosmetics = requiredCosmeticsFunctions.filter(fn => !cosmeticsFunctions.includes(fn));

if (missingCosmetics.length > 0) {
  throw new Error(`Cosmetics ABI missing critical functions: ${missingCosmetics.join(", ")}`);
}

// Output checksums for tracking changes
console.log("✅ ABI verification passed!");
console.log("\nABI checksums:");
console.log("  MAW:       ", hash(compiledMaw).substring(0, 12) + "...");
console.log("  Relics:    ", hash(compiledRelics).substring(0, 12) + "...");
console.log("  Cosmetics: ", hash(compiledCosmetics).substring(0, 12) + "...");
console.log("\nTotal functions:");
console.log("  MAW:       ", mawFunctions.length);
console.log("  Relics:    ", relicsFunctions.length);
console.log("  Cosmetics: ", cosmeticsFunctions.length);