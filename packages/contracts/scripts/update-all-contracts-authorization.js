const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Setting ALL contracts to use the correct MawSacrifice address...");
  
  const [signer] = await ethers.getSigners();
  const networkAddresses = addresses.baseSepolia;
  const CORRECT_MAW = networkAddresses.MawSacrifice;
  
  console.log("Setting MawSacrifice to:", CORRECT_MAW);
  
  try {
    // 1. Fix Relics authorization
    console.log("1. Fixing Relics authorization...");
    const relics = await ethers.getContractAt("Relics", networkAddresses.Relics);
    const tx1 = await relics.setMawSacrifice(CORRECT_MAW);
    await tx1.wait();
    console.log("✅ Relics updated:", tx1.hash);
    
    // 2. Fix Cosmetics authorization
    console.log("2. Fixing Cosmetics authorization...");
    const cosmetics = await ethers.getContractAt("CosmeticsV2", networkAddresses.Cosmetics);
    const tx2 = await cosmetics.setContracts(networkAddresses.Raccoons, CORRECT_MAW);
    await tx2.wait();
    console.log("✅ Cosmetics updated:", tx2.hash);
    
    // 3. Fix Cultists authorization (if it has setMawSacrifice)
    console.log("3. Fixing Cultists authorization...");
    const cultists = await ethers.getContractAt("Cultists", networkAddresses.Cultists);
    const tx3 = await cultists.setMawSacrifice(CORRECT_MAW);
    await tx3.wait();
    console.log("✅ Cultists updated:", tx3.hash);
    
    console.log("\n🎉 ALL contracts now point to the same MawSacrifice address!");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
