const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging actual function selectors...\n");
  
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  // Test what selector 0x0cce1e93 actually corresponds to
  console.log("=== SELECTOR ANALYSIS ===");
  const testSelector = "0x0cce1e93";
  console.log("Frontend is calling selector:", testSelector);
  
  // Calculate what this selector should be for different functions
  const signatures = [
    'sacrificeForCosmetic(uint256,uint256)',
    'sacrificeCosmetics(uint256)', 
    'sacrificeKeys(uint256)',
    'sacrificeDemons(uint256,uint8)'
  ];
  
  signatures.forEach(sig => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(sig));
    const calculatedSelector = hash.slice(0, 10);
    console.log(`${sig} -> ${calculatedSelector}`);
    if (calculatedSelector === testSelector) {
      console.log(`*** MATCH! Frontend is actually calling: ${sig} ***`);
    }
  });
  
  // Connect to actual deployed contract and check what functions exist
  console.log("\n=== DEPLOYED CONTRACT ANALYSIS ===");
  const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", proxyAddress);
  
  const functions = [
    'sacrificeForCosmetic',
    'sacrificeCosmetics', 
    'sacrificeKeys',
    'sacrificeDemons'
  ];
  
  for (const funcName of functions) {
    try {
      const fragment = proxy.interface.getFunction(funcName);
      console.log(`✅ ${funcName}: ${fragment.format()}`);
    } catch (error) {
      console.log(`❌ ${funcName}: NOT FOUND`);
    }
  }
  
  // Check the transaction data being sent
  console.log("\n=== TRANSACTION DATA ANALYSIS ===");
  console.log("Transaction data: 0x0cce1e9300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000");
  console.log("Selector (first 4 bytes): 0x0cce1e93");
  console.log("First parameter (32 bytes): 0x0000000000000000000000000000000000000000000000000000000000000001 = 1");
  console.log("Second parameter (32 bytes): 0x0000000000000000000000000000000000000000000000000000000000000000 = 0");
  console.log("So frontend is calling someFunction(1, 0)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});