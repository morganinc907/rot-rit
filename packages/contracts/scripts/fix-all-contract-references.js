const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking MawSacrifice contract setup...");
  
  const networkAddresses = addresses.baseSepolia;
  const [signer] = await ethers.getSigners();
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrifice);
    const relics = await ethers.getContractAt("Relics", networkAddresses.Relics);
    
    console.log("Checking MawSacrifice proxy contract references:");
    
    try {
      const relicsAddr = await maw.relics();
      console.log("- Relics in Maw:", relicsAddr);
      console.log("- Expected:", networkAddresses.Relics);
      console.log("- Match:", relicsAddr.toLowerCase() === networkAddresses.Relics.toLowerCase());
    } catch (e) {
      console.log("- Relics getter error:", e.message);
    }
    
    try {
      const cosmeticsAddr = await maw.cosmetics();
      console.log("- Cosmetics in Maw:", cosmeticsAddr);
      console.log("- Expected:", networkAddresses.Cosmetics);
      console.log("- Match:", cosmeticsAddr.toLowerCase() === networkAddresses.Cosmetics.toLowerCase());
    } catch (e) {
      console.log("- Cosmetics getter error:", e.message);
    }
    
    console.log("\nChecking Relics contract authorization:");
    const mawInRelics = await relics.mawSacrifice();
    console.log("- MawSacrifice in Relics:", mawInRelics);
    console.log("- Expected:", networkAddresses.MawSacrifice);
    console.log("- Match:", mawInRelics.toLowerCase() === networkAddresses.MawSacrifice.toLowerCase());
    
    // If they dont match, fix them
    if (mawInRelics.toLowerCase() !== networkAddresses.MawSacrifice.toLowerCase()) {
      console.log("\n🔧 Fixing Relics authorization...");
      const owner = await relics.owner();
      if (owner.toLowerCase() === signer.address.toLowerCase()) {
        const tx = await relics.setMawSacrifice(networkAddresses.MawSacrifice);
        await tx.wait();
        console.log("✅ Fixed Relics authorization");
      } else {
        console.log("❌ Not owner, cannot fix");
      }
    }
    
    // Check if we need to set contract addresses in Maw
    try {
      const currentRelics = await maw.relics();
      if (currentRelics.toLowerCase() !== networkAddresses.Relics.toLowerCase()) {
        console.log("\n🔧 Fixing Maw->Relics reference...");
        const tx = await maw.setContracts(
          networkAddresses.Relics,
          networkAddresses.Cosmetics,
          networkAddresses.Cultists,
          networkAddresses.Raccoons
        );
        await tx.wait();
        console.log("✅ Fixed Maw contract references");
      }
    } catch (e) {
      console.log("Cannot fix Maw references:", e.message);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
