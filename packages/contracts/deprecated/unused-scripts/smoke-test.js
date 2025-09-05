// scripts/smoke-test.js  
// Post-deploy smoke test - "doctor" script that validates everything is working

const hre = require("hardhat");
const { decodeError, safeCall } = require("../lib/decodeError");

async function main() {
  console.log("🏥 Running post-deploy smoke test...\n");
  
  const [signer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  // Load canonical packages
  const addresses = require("../packages/addresses/addresses.json");
  const abis = require("../packages/abis/index.json");
  
  if (!addresses[network]) {
    throw new Error(`No addresses found for network: ${network}`);
  }
  
  const mawAddress = addresses[network]["MawSacrificeV3Upgradeable"];
  const relicsAddress = addresses[network]["Relics"];
  
  if (!mawAddress || !relicsAddress) {
    throw new Error("Missing critical contract addresses");
  }
  
  console.log("📋 Smoke Test Configuration:");
  console.log(`   Network: ${network}`);
  console.log(`   MawSacrifice: ${mawAddress}`);
  console.log(`   Relics: ${relicsAddress}`);
  
  const maw = new hre.ethers.Contract(mawAddress, abis.MawSacrificeV3Upgradeable, signer);
  const relics = new hre.ethers.Contract(relicsAddress, abis.Relics, signer);
  
  const tests = [];
  let passed = 0;
  let failed = 0;
  
  // Test 1: Proxy → Implementation verification
  tests.push(async () => {
    console.log("1️⃣ Proxy → Implementation Check");
    
    const EIP1967_IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const raw = await hre.ethers.provider.getStorage(mawAddress, EIP1967_IMPL_SLOT);
    const implAddress = hre.ethers.getAddress("0x" + raw.slice(26));
    
    console.log(`   Implementation: ${implAddress}`);
    
    // Verify implementation has code
    const implCode = await hre.ethers.provider.getCode(implAddress);
    if (implCode === "0x") {
      throw new Error("Implementation has no code!");
    }
    
    console.log("   ✅ Proxy points to valid implementation");
  });
  
  // Test 2: Version check
  tests.push(async () => {
    console.log("2️⃣ Version Check");
    
    const version = await safeCall(
      () => maw.version(), 
      'MawSacrificeV3Upgradeable', 
      'Get version'
    );
    
    console.log(`   Version: ${version}`);
    
    if (!version.includes("MawSacrificeV3Upgradeable")) {
      throw new Error("Unexpected version string");
    }
    
    console.log("   ✅ Version matches expected format");
  });
  
  // Test 3: Core constants
  tests.push(async () => {
    console.log("3️⃣ Core Constants Check");
    
    const rustedKey = await maw.RUSTED_KEY();
    const ashes = await maw.ASHES();
    const maxMythic = await maw.MAX_MYTHIC_DEMONS();
    
    console.log(`   RUSTED_KEY: ${rustedKey} (should be 1)`);
    console.log(`   ASHES: ${ashes} (should be 8)`);
    console.log(`   MAX_MYTHIC_DEMONS: ${maxMythic} (should be 100)`);
    
    if (rustedKey !== 1n || ashes !== 8n || maxMythic !== 100n) {
      throw new Error("Core constants don't match expected values");
    }
    
    console.log("   ✅ All constants correct");
  });
  
  // Test 4: Authorization check
  tests.push(async () => {
    console.log("4️⃣ Authorization Check");
    
    const relicsMaw = await relics.mawSacrifice();
    console.log(`   Relics.mawSacrifice: ${relicsMaw}`);
    
    if (relicsMaw.toLowerCase() !== mawAddress.toLowerCase()) {
      throw new Error("Relics contract not properly authorized with proxy");
    }
    
    console.log("   ✅ Authorization configured correctly");
  });
  
  // Test 5: Static call validation (no side effects)
  tests.push(async () => {
    console.log("5️⃣ Static Call Validation");
    
    // Test all major view functions work without reverting
    await maw.paused.staticCall();
    await maw.owner.staticCall();
    await maw.mythicDemonsMinted.staticCall();
    await maw.minBlocksBetweenSacrifices.staticCall();
    await maw.getCurrentCosmeticTypes.staticCall();
    
    console.log("   ✅ All view functions callable");
  });
  
  // Test 6: Critical error conditions (should revert properly)
  tests.push(async () => {
    console.log("6️⃣ Error Condition Validation");
    
    // Test invalid amount (should revert with InvalidAmount)
    try {
      await maw.sacrificeKeys.staticCall(0);
      throw new Error("Should have reverted with InvalidAmount");
    } catch (error) {
      const decoded = decodeError(error, 'MawSacrificeV3Upgradeable');
      if (decoded.name !== 'InvalidAmount') {
        throw new Error(`Expected InvalidAmount, got: ${decoded.message}`);
      }
    }
    
    // Test conversion with invalid amount  
    try {
      await maw.convertShardsToRustedCaps.staticCall(3); // Not multiple of 5
      throw new Error("Should have reverted with InvalidAmount");
    } catch (error) {
      const decoded = decodeError(error, 'MawSacrificeV3Upgradeable');
      if (decoded.name !== 'InvalidAmount') {
        throw new Error(`Expected InvalidAmount, got: ${decoded.message}`);
      }
    }
    
    console.log("   ✅ Error conditions work as expected");
  });
  
  // Run all tests
  console.log("\n🧪 Running smoke tests...\n");
  
  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      console.error(`   ❌ Test failed: ${error.message}`);
      failed++;
    }
    console.log(); // Empty line between tests
  }
  
  // Results
  console.log("📊 Smoke Test Results:");
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);
  
  if (failed > 0) {
    console.log("\n🚨 Smoke test failures detected!");
    console.log("   This deployment may have issues. Please investigate before proceeding.");
    process.exit(1);
  } else {
    console.log("\n🎉 All smoke tests passed!");
    console.log("   Deployment looks healthy and ready for use. 🚀");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Smoke test crashed:", error.message);
    process.exit(1);
  });