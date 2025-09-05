const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing new sacrificeForCosmetic function...\n");
  
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const [signer] = await ethers.getSigners();
  
  // Connect using V4 ABI
  const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", proxyAddress);
  
  try {
    const fragment = proxy.interface.getFunction("sacrificeForCosmetic");
    console.log("✅ Found sacrificeForCosmetic function:");
    console.log("   Full signature:", fragment.format());
    console.log("   Name:", fragment.name);
    console.log("   Inputs:", fragment.inputs.map(i => `${i.name}: ${i.type}`).join(', '));
    
    // Calculate the selector
    const selector = proxy.interface.getSighash(fragment);
    console.log("   Selector:", selector);
    
  } catch (error) {
    console.log("❌ Could not get sacrificeForCosmetic function:", error.message);
  }
  
  // Also check if old function is gone
  try {
    const oldFragment = proxy.interface.getFunction("sacrificeCosmetics");
    console.log("❌ OLD sacrificeCosmetics function still exists:", oldFragment.format());
  } catch (error) {
    console.log("✅ OLD sacrificeCosmetics function is gone (as expected)");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});