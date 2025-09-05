// scripts/checkProxyAbi.js
// Blocks CI if your published JSON ABI is missing expected fragments.

const fs = require("fs");
const path = require("path");

const network = process.env.NETWORK || "baseSepolia";
const name = process.env.CONTRACT || "MawSacrificeV3Upgradeable";
const p = path.join("deployments", network, `${name}.json`);

console.log(`🔍 Checking ABI health for ${name} on ${network}...`);

if (!fs.existsSync(p)) {
  throw new Error(`Deployment file not found: ${p}. Run genProxyDeployment.js first.`);
}

const j = JSON.parse(fs.readFileSync(p, "utf8"));

function has(name, inputs = undefined) {
  return j.abi.some(
    (f) =>
      f.type === "function" &&
      f.name === name &&
      (inputs ? JSON.stringify((f.inputs || []).map((i) => i.type)) === JSON.stringify(inputs) : true)
  );
}

// Critical functions that must exist
const checks = [
  ["version", []],
  ["convertShardsToRustedCaps", ["uint256"]],
  ["sacrificeKeys", ["uint256"]],
  ["sacrificeCosmetics", ["uint256"]],
  ["sacrificeDemons", ["uint256", "uint8"]],
  ["sacrificeCultist", ["uint256"]],
  ["initialize", ["address", "address", "address", "address", "uint256"]],
  ["paused", []],
  ["owner", []],
];

console.log(`Checking ${checks.length} critical functions...`);

let passed = 0;
for (const [fn, ins] of checks) {
  if (!has(fn, ins)) {
    console.error(`❌ Missing: ${fn}(${(ins||[]).join(",")})`);
    throw new Error(`Deployment ABI is stale/mismatched. Missing ${fn}(${(ins||[]).join(",")}). File: ${p}`);
  } else {
    console.log(`✅ Found: ${fn}(${(ins||[]).join(",")})`);
    passed++;
  }
}

// Check for expected events
const expectedEvents = [
  "CapsCrafted", "KeysSacrificed", "MythicMinted", "DemonRitualAttempted", 
  "CosmeticRitualAttempted", "CultistsSacrificed"
];

console.log(`\nChecking ${expectedEvents.length} critical events...`);

for (const eventName of expectedEvents) {
  const hasEvent = j.abi.some(f => f.type === "event" && f.name === eventName);
  if (!hasEvent) {
    console.error(`❌ Missing event: ${eventName}`);
    throw new Error(`Deployment ABI missing expected event: ${eventName}`);
  } else {
    console.log(`✅ Found event: ${eventName}`);
    passed++;
  }
}

console.log(`\n🎉 ABI health check PASSED!`);
console.log(`   File: ${p}`);
console.log(`   Address: ${j.address} (proxy)`);
console.log(`   Implementation: ${j.implementation}`);
console.log(`   Functions checked: ${checks.length}/${passed}`);
console.log(`   Events checked: ${expectedEvents.length}/${passed - checks.length}`);
console.log(`   Total ABI entries: ${j.abi.length}`);
console.log(`   Updated: ${j.updatedAt}`);