const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging sacrificeCosmetics function signature...\n");
  
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const [signer] = await ethers.getSigners();
  
  // Connect using V3 ABI
  const proxy = await ethers.getContractAt("MawSacrificeV3Upgradeable", proxyAddress);
  
  try {
    const fragment = proxy.interface.getFunction("sacrificeCosmetics");
    console.log("✅ Found sacrificeCosmetics function:");
    console.log("   Full signature:", fragment.format());
    console.log("   Name:", fragment.name);
    console.log("   Inputs:", fragment.inputs.map(i => `${i.name}: ${i.type}`).join(', '));
    
    // Calculate the selector
    const selector = proxy.interface.getSighash(fragment);
    console.log("   Selector:", selector);
    
    // Test what selector should be for different signatures
    console.log("\n🧮 Testing different possible signatures:");
    const { keccak256 } = require("ethers");
    
    const signatures = [
      'sacrificeCosmetics(uint256)',
      'sacrificeCosmetics(uint256[])',
      'sacrificeCosmetics(uint256,uint256)',
      'sacrificeCosmetics(uint256[],uint256[])'
    ];
    
    signatures.forEach(sig => {
      const hash = keccak256(ethers.utils.toUtf8Bytes(sig));
      const calculatedSelector = hash.slice(0, 10);
      console.log(`   ${sig} -> ${calculatedSelector}`);
      if (calculatedSelector === selector) {
        console.log(`   *** MATCH! This is the deployed function signature ***`);
      }
    });
    
  } catch (error) {
    console.log("❌ Could not get sacrificeCosmetics function:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});