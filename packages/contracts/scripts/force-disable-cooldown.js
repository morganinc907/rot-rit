const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Permanently disabling cooldown...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const [signer] = await ethers.getSigners();
  
  console.log("Signer:", signer.address);
  console.log("MawSacrifice:", PROXY_ADDRESS);
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    
    // Check current cooldown
    const currentCooldown = await maw.minBlocksBetweenSacrifices();
    console.log("Current cooldown:", currentCooldown.toString());
    
    // Force set to 0
    console.log("\nForcing cooldown to 0...");
    const tx = await maw.setMinBlocksBetweenSacrifices(0);
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ Transaction confirmed");
    
    // Verify it worked
    const newCooldown = await maw.minBlocksBetweenSacrifices();
    console.log("New cooldown:", newCooldown.toString());
    
    if (newCooldown == 0) {
      console.log("\n🎉 SUCCESS! Cooldown permanently disabled");
      console.log("Users can now sacrifice without any cooldown restrictions");
    } else {
      console.log("\n⚠️ WARNING: Cooldown still set to", newCooldown.toString());
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
