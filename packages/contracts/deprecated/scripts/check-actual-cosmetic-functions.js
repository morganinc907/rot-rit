const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking what cosmetic functions are actually deployed...\n");
  
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const [signer] = await ethers.getSigners();
  
  // Connect using V3 ABI
  const proxy = await ethers.getContractAt("MawSacrificeV3Upgradeable", proxyAddress);
  
  console.log("📋 Testing Cosmetic Function Availability:");
  
  const functionsToTest = [
    'sacrificeForCosmetic',
    'sacrificeCosmetics', 
    'sacrificeKeys',
    'convertAshes'
  ];
  
  for (const funcName of functionsToTest) {
    try {
      const func = proxy[funcName];
      if (func) {
        console.log(`✅ ${funcName}: Available`);
        // Try to get function fragment info
        try {
          const fragment = proxy.interface.getFunction(funcName);
          console.log(`   Signature: ${fragment.format()}`);
        } catch (e) {
          console.log(`   (Could not get signature: ${e.message})`);
        }
      } else {
        console.log(`❌ ${funcName}: Not available`);
      }
    } catch (error) {
      console.log(`❌ ${funcName}: Error - ${error.message}`);
    }
  }
  
  console.log("\n🔍 Looking for any sacrifice-related functions:");
  const allFunctions = Object.keys(proxy.interface.functions);
  const sacrificeFunctions = allFunctions.filter(f => f.toLowerCase().includes('sacrifice'));
  
  console.log("Available sacrifice functions:");
  sacrificeFunctions.forEach(func => {
    const fragment = proxy.interface.getFunction(func);
    console.log(`  📝 ${fragment.format()}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});