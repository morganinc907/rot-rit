const { ethers } = require("hardhat");
const { baseSepolia } = require("../../addresses/addresses.json");

async function main() {
  console.log("🎨 Checking available cosmetics...\n");
  
  const COSMETICS_ADDRESS = baseSepolia.Cosmetics;
  const cosmetics = await ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);
  
  console.log("Cosmetics contract:", COSMETICS_ADDRESS);
  
  // Check cosmetic types 1-20 to see what's available
  const availableCosmetics = [];
  
  for (let typeId = 1; typeId <= 20; typeId++) {
    try {
      const [name, description, imageURI, slot, rarity, supply, unlimited] = await cosmetics.getCosmeticInfo(typeId);
      
      if (name && name !== "") {
        availableCosmetics.push({
          typeId,
          name,
          slot,
          rarity,
          supply: supply.toString(),
          unlimited
        });
        
        console.log(`${typeId}: ${name} (Slot: ${slot}, Rarity: ${rarity}, Supply: ${supply.toString()}, Unlimited: ${unlimited})`);
      }
    } catch (error) {
      // Skip non-existent types
    }
  }
  
  console.log(`\n📊 Found ${availableCosmetics.length} available cosmetics`);
  
  // Suggest a good mix for monthly cosmetics
  const suggested = availableCosmetics.map(c => c.typeId);
  console.log("\n💡 Suggested cosmetic types for setMonthlyCosmeticTypes:");
  console.log(`[${suggested.join(', ')}]`);
}

main().catch(console.error);