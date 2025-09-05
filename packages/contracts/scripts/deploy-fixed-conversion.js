const { ethers, upgrades } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🚀 Deploying fixed conversion implementation...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  
  try {
    console.log("📦 Deploying new implementation with RUSTED_CAP = 0...");
    const MawV4Factory = await ethers.getContractFactory("MawSacrificeV4NoTimelock");
    
    // Upgrade the proxy to the new implementation
    const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, MawV4Factory);
    console.log("✅ Proxy upgraded with fixed token ID!");
    
    // Test the fix
    console.log("\n🧪 Testing fixed conversion...");
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    
    // Check the constant value
    const rustedCapId = await maw.RUSTED_CAP();
    console.log(`RUSTED_CAP constant now set to: ${rustedCapId}`);
    
    if (rustedCapId.toString() === "0") {
      console.log("✅ Correct! RUSTED_CAP is now ID 0");
      
      // Test the conversion
      try {
        const result = await maw.convertShardsToRustedCaps.staticCall(5);
        console.log("✅ Conversion simulation still works");
        console.log("🎉 Now it will mint the correct tokens (ID 0)!");
        
      } catch (error) {
        console.log("❌ Conversion failed after fix:", error.message);
      }
    } else {
      console.log("❌ RUSTED_CAP is still wrong:", rustedCapId.toString());
    }
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
  }
}

main().catch(console.error);