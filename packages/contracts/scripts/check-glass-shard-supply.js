const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking supply limits for GLASS_SHARD...");
  
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  const GLASS_SHARD_ID = 6;
  
  try {
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    // Check supply info for GLASS_SHARD
    const supplyInfo = await relics.getSupplyInfo(GLASS_SHARD_ID);
    const currentSupply = supplyInfo[0];
    const maxSupply = supplyInfo[1];
    
    console.log("GLASS_SHARD (ID 6) supply info:");
    console.log("- Current supply:", currentSupply.toString());
    console.log("- Max supply:", maxSupply.toString());
    console.log("- Supply available:", maxSupply > 0 ? (maxSupply - currentSupply).toString() : "unlimited");
    
    if (maxSupply > 0 && currentSupply >= maxSupply) {
      console.log("\n🚨 PROBLEM FOUND: GLASS_SHARD supply is maxed out!");
      console.log("This is why minting GLASS_SHARD fails in sacrificeKeys");
      
      // Check if we can increase the supply
      const owner = await relics.owner();
      const [signer] = await ethers.getSigners();
      
      if (owner.toLowerCase() === signer.address.toLowerCase()) {
        console.log("\n🔧 We are owner, can increase max supply");
        console.log("Setting unlimited supply for GLASS_SHARD...");
        const tx = await relics.setMaxSupply(GLASS_SHARD_ID, 0); // 0 = unlimited
        await tx.wait();
        console.log("✅ Set unlimited supply for GLASS_SHARD:", tx.hash);
      }
    } else if (maxSupply == 0) {
      console.log("✅ GLASS_SHARD has unlimited supply, not the issue");
    }
    
    // Also check other reward tokens
    console.log("\nChecking other reward token supplies:");
    const rewardTokens = [
      { id: 2, name: "LANTERN_FRAGMENT" },
      { id: 3, name: "WORM_EATEN_MASK" },
      { id: 4, name: "BONE_DAGGER" }, 
      { id: 5, name: "ASH_VIAL" }
    ];
    
    for (const token of rewardTokens) {
      const info = await relics.getSupplyInfo(token.id);
      console.log(`${token.name}: ${info[0]}/${info[1] == 0 ? "∞" : info[1]}`);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
