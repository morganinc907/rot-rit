const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔥 Testing sacrifice with addresses.json contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("User:", deployer.address);
  
  const networkAddresses = addresses.baseSepolia;
  console.log("MawSacrifice:", networkAddresses.MawSacrifice);
  console.log("Relics:", networkAddresses.Relics);
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrifice);
    const relics = await ethers.getContractAt("Relics", networkAddresses.Relics);
    
    // Check balance
    const balance = await relics.balanceOf(deployer.address, 1);
    console.log("Rusted caps balance:", balance.toString());
    
    if (balance > 0) {
      console.log("Attempting sacrifice...");
      const tx = await maw.sacrificeKeys(1);
      const receipt = await tx.wait();
      console.log("✅ SUCCESS!", receipt.hash);
    } else {
      console.log("No rusted caps to sacrifice");
    }
    
  } catch (error) {
    console.log("❌ FAILED:", error.message);
  }
}

main().catch(console.error);
