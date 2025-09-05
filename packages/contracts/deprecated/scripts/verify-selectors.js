// scripts/verify-selectors.js
// Verifies that all ABI selectors exist in deployed bytecode (catches ABI drift)

const hre = require("hardhat");
const { keccak256 } = require("@ethersproject/keccak256");
const { toUtf8Bytes } = require("@ethersproject/strings");

async function main() {
  console.log("🔍 Verifying contract selectors against bytecode...\n");
  
  const network = hre.network.name;
  const addresses = require("../packages/addresses/addresses.json");
  const abis = require("../packages/abis/index.json");
  
  if (!addresses[network]) {
    throw new Error(`No addresses found for network: ${network}`);
  }
  
  let totalChecked = 0;
  let totalMissing = 0;
  let contracts = 0;
  
  for (const [contractName, contractAddress] of Object.entries(addresses[network])) {
    console.log(`📋 Checking ${contractName} at ${contractAddress}:`);
    
    const abi = abis[contractName];
    if (!abi) {
      console.log(`   ⚠️  No ABI found for ${contractName}`);
      continue;
    }
    
    // Get deployed bytecode
    const bytecode = await hre.ethers.provider.getCode(contractAddress);
    if (bytecode === "0x") {
      console.log(`   ❌ No bytecode at address`);
      continue;
    }
    
    // Extract function selectors from ABI
    const selectors = extractSelectors(abi);
    console.log(`   Functions to check: ${selectors.length}`);
    
    let missing = 0;
    let checked = 0;
    
    for (const { name, selector } of selectors) {
      if (bytecode.includes(selector.slice(2))) { // Remove 0x prefix
        checked++;
      } else {
        console.log(`   ❌ Missing selector: ${name} (${selector})`);
        missing++;
      }
    }
    
    if (missing === 0) {
      console.log(`   ✅ All ${checked} selectors found in bytecode`);
    } else {
      console.log(`   ⚠️  ${missing}/${selectors.length} selectors missing from bytecode`);
    }
    
    totalChecked += checked;
    totalMissing += missing;
    contracts++;
    console.log();
  }
  
  // Summary
  console.log("📊 Selector Verification Summary:");
  console.log(`   Contracts checked: ${contracts}`);
  console.log(`   Total selectors: ${totalChecked + totalMissing}`);
  console.log(`   Found: ${totalChecked}`);
  console.log(`   Missing: ${totalMissing}`);
  console.log(`   Success rate: ${Math.round((totalChecked / (totalChecked + totalMissing)) * 100)}%`);
  
  if (totalMissing > 0) {
    console.log(`\n❌ Found ${totalMissing} missing selectors!`);
    console.log("   This indicates ABI drift - the deployed contract doesn't match the ABI.");
    console.log("   Possible causes:");
    console.log("   • Stale deployment JSON");
    console.log("   • Contract upgraded but ABI not updated");
    console.log("   • Wrong implementation address in proxy");
    
    process.exit(1);
  } else {
    console.log("\n✅ All selectors verified! No ABI drift detected.");
  }
}

function extractSelectors(abi) {
  const selectors = [];
  
  for (const item of abi) {
    if (item.type === "function") {
      const signature = buildFunctionSignature(item);
      const selector = keccak256(toUtf8Bytes(signature)).slice(0, 10); // First 4 bytes
      
      selectors.push({
        name: item.name,
        signature,
        selector
      });
    }
  }
  
  return selectors;
}

function buildFunctionSignature(func) {
  const inputs = func.inputs.map(input => input.type).join(',');
  return `${func.name}(${inputs})`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Selector verification failed:", error.message);
    process.exit(1);
  });