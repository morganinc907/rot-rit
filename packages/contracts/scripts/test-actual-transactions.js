const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🧪 Testing ACTUAL sacrifice transactions...");
  
  const [deployer] = await ethers.getSigners();
  const networkAddresses = addresses.baseSepolia;
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrifice);
    const relics = await ethers.getContractAt("Relics", networkAddresses.Relics);
    
    // Check balances
    const keyBalance = await relics.balanceOf(deployer.address, 1);
    const fragmentBalance = await relics.balanceOf(deployer.address, 2);
    
    console.log("Balances:");
    console.log("- Rusted Caps:", keyBalance.toString());
    console.log("- Fragments:", fragmentBalance.toString());
    
    // Test 1: ACTUAL keys sacrifice
    if (keyBalance > 0) {
      console.log("\n🔑 Testing ACTUAL sacrificeKeys...");
      try {
        const tx1 = await maw.sacrificeKeys(1);
        const receipt1 = await tx1.wait();
        console.log("✅ sacrificeKeys SUCCESS:", receipt1.hash);
      } catch (e) {
        console.log("❌ sacrificeKeys FAILED:", e.message);
      }
    }
    
    // Test 2: ACTUAL cosmetic sacrifice
    if (fragmentBalance > 0) {
      console.log("\n🎨 Testing ACTUAL sacrificeForCosmetic...");
      try {
        const tx2 = await maw.sacrificeForCosmetic(1, 0);
        const receipt2 = await tx2.wait();
        console.log("✅ sacrificeForCosmetic SUCCESS:", receipt2.hash);
      } catch (e) {
        console.log("❌ sacrificeForCosmetic FAILED:", e.message);
      }
    }
    
  } catch (error) {
    console.error("Script error:", error.message);
  }
}

main().catch(console.error);
