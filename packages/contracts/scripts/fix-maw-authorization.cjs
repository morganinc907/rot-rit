const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Fixing MAW authorization...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  
  console.log("MAW Proxy:", PROXY_ADDRESS);
  console.log("Relics:", RELICS_ADDRESS);
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  // Set MAW sacrifice to grant MAW_ROLE
  console.log("\n🚀 Setting MAW sacrifice permissions...");
  const tx = await relics.setMawSacrifice(PROXY_ADDRESS);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("✅ Authorization set!");
  
  // Test canMintCaps now
  console.log("\n🧪 Testing canMintCaps after authorization...");
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const canMint = await maw.canMintCaps(1);
  console.log("canMintCaps(1):", canMint);
  
  if (canMint) {
    console.log("🎉 SUCCESS! Conversion should work now!");
    
    // Quick test with static call
    try {
      await maw.convertShardsToRustedCaps.staticCall(5);
      console.log("✅ Conversion static call succeeded!");
    } catch (error) {
      console.log("❌ Conversion still failing:", error.message);
    }
  } else {
    console.log("❌ canMintCaps still false - there may be another issue");
  }
}

main().catch(console.error);