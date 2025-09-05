const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Checking and fixing Cosmetics authorization...");
  
  const [signer] = await ethers.getSigners();
  const networkAddresses = addresses.baseSepolia;
  
  console.log("MawSacrifice:", networkAddresses.MawSacrifice);
  console.log("Cosmetics:", networkAddresses.Cosmetics);
  
  try {
    const cosmetics = await ethers.getContractAt("CosmeticsV2", networkAddresses.Cosmetics);
    
    // Check current MawSacrifice address in Cosmetics
    const currentMaw = await cosmetics.mawSacrifice();
    console.log("Current mawSacrifice in Cosmetics:", currentMaw);
    console.log("Expected:", networkAddresses.MawSacrifice);
    console.log("Match:", currentMaw.toLowerCase() === networkAddresses.MawSacrifice.toLowerCase());
    
    // Fix if needed
    if (currentMaw.toLowerCase() !== networkAddresses.MawSacrifice.toLowerCase()) {
      console.log("\n🔧 Setting correct MawSacrifice address in Cosmetics...");
      const tx = await cosmetics.setMawSacrifice(networkAddresses.MawSacrifice);
      await tx.wait();
      console.log("✅ Fixed Cosmetics authorization:", tx.hash);
    } else {
      console.log("✅ Cosmetics already has correct MawSacrifice address");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
