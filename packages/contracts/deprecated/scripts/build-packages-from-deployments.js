// scripts/build-packages-from-deployments.js
// Aggregates deployments/<network>/*.json (proxy address + impl ABI)
// into packages/addresses/addresses.json and packages/abis/index.json,
// plus a typed helper packages/addresses/index.ts.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DEPLOY_DIR = path.join("deployments");
const PKG_ADDR = path.join("packages", "addresses");
const PKG_ABIS = path.join("packages", "abis");

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function sha256(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }

function main() {
  console.log("🔧 Building canonical packages from deployments...\n");
  
  if (!fs.existsSync(DEPLOY_DIR)) {
    throw new Error(`Missing ${DEPLOY_DIR}. Run your deploy + genProxyDeployment first.`);
  }

  const networks = fs.readdirSync(DEPLOY_DIR).filter(f =>
    fs.statSync(path.join(DEPLOY_DIR, f)).isDirectory()
  );

  console.log(`Found networks: ${networks.join(", ")}`);

  const addresses = {};           // { [network]: { [name]: "0x..." } }
  const abisByName = {};          // { [name]: ABI }
  const abiHashByName = {};       // { [name]: sha256(abi) }

  for (const net of networks) {
    const netDir = path.join(DEPLOY_DIR, net);
    const files = fs.readdirSync(netDir).filter(f => f.endsWith(".json"));

    console.log(`\n📂 Processing ${net}:`);
    addresses[net] = addresses[net] || {};

    for (const file of files) {
      const j = readJson(path.join(netDir, file));
      const name = j.name || path.basename(file, ".json");
      const proxy = j.address;
      const abi = j.abi;

      if (!proxy || !abi) {
        throw new Error(`Bad deployment JSON: ${file}. Expected {address, abi}.`);
      }
      
      console.log(`  ✅ ${name}: ${proxy}`);
      
      // Record address
      addresses[net][name] = proxy;

      // Enforce ABI consistency across networks
      const h = sha256(abi);
      if (!abisByName[name]) {
        abisByName[name] = abi;
        abiHashByName[name] = h;
        console.log(`    📝 Recorded ABI (${abi.filter(f => f.type === 'function').length} functions)`);
      } else if (abiHashByName[name] !== h) {
        throw new Error(
          `ABI drift for ${name} across networks.\n` +
          `File: ${file}\n` +
          `Make sure all networks for ${name} use the SAME implementation ABI.`
        );
      } else {
        console.log(`    ✓ ABI matches existing`);
      }
    }
  }

  // Write packages
  ensureDir(PKG_ADDR);
  ensureDir(PKG_ABIS);

  fs.writeFileSync(
    path.join(PKG_ADDR, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );

  fs.writeFileSync(
    path.join(PKG_ABIS, "index.json"),
    JSON.stringify(abisByName, null, 2)
  );

  // Typed helper
  const idxTs = `/* auto-generated */ 
export const addresses = ${JSON.stringify(addresses, null, 2)} as const;

export type Networks = keyof typeof addresses;
export type ContractsOf<N extends Networks> = keyof typeof addresses[N];

export function getAddress<N extends Networks>(network: N, name: ContractsOf<N>) {
  return addresses[network][name] as \`0x\${string}\`;
}
`;
  fs.writeFileSync(path.join(PKG_ADDR, "index.ts"), idxTs);

  console.log("\n✅ Generated canonical packages:");
  console.log("   📦 packages/addresses/addresses.json");
  console.log("   📦 packages/addresses/index.ts");
  console.log("   📦 packages/abis/index.json");
  
  console.log("\n📊 Summary:");
  console.log(`   Networks: ${Object.keys(addresses).length}`);
  console.log(`   Contracts: ${Object.keys(abisByName).length}`);
  console.log(`   Total deployments: ${Object.values(addresses).reduce((sum, net) => sum + Object.keys(net).length, 0)}`);
}

main();