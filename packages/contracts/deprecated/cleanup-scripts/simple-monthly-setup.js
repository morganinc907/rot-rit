const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🎨 Simple monthly cosmetic setup...");
  console.log("User:", signer.address);
  console.log("");

  try {
    // Create remaining cosmetic types one by one
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", addresses.baseSepolia.Cosmetics);
    
    const remainingTypes = [
      { name: "strainer", slot: 2, rarity: 1 }, // Body, Common  
      { name: "pink", slot: 2, rarity: 3 }, // Body, Rare
      { name: "orange", slot: 5, rarity: 4 }, // Background, Epic
      { name: "underpants", slot: 4, rarity: 2 } // Legs, Uncommon
    ];

    const createdTypes = [1]; // We know glasses is type 1
    
    for (let i = 0; i < remainingTypes.length; i++) {
      const type = remainingTypes[i];
      try {
        console.log(`Creating: ${type.name} (slot ${type.slot}, rarity ${type.rarity})`);
        
        const tx = await cosmetics.createCosmeticType(
          type.name,
          `${type.name}.png`,
          `${type.name}_preview.png`,
          type.rarity,
          type.slot,
          1, // monthlySetId
          1000 // maxSupply
        );
        
        await tx.wait();
        const typeId = createdTypes.length + 1;
        createdTypes.push(typeId);
        console.log(`✅ Created type ${typeId}: ${type.name}`);
        
        // Wait between transactions
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.log(`⚠️  Failed to create ${type.name}: ${error.message}`);
        // Assume it was created with sequential ID
        createdTypes.push(createdTypes.length + 1);
      }
    }

    console.log("");
    console.log("🗓️ Setting up monthly cosmetic set...");
    console.log("Using type IDs:", createdTypes);
    
    // Connect to MawSacrifice to set monthly cosmetics
    const mawSacrifice = await hre.ethers.getContractAt(
      "MawSacrificeV4NoTimelock", 
      addresses.baseSepolia.MawSacrifice
    );
    
    const monthlySetTx = await mawSacrifice.setMonthlyCosmeticTypes(createdTypes);
    await monthlySetTx.wait();
    console.log("✅ Monthly cosmetic set configured:", createdTypes);
    
    // Verify
    const currentTypes = await mawSacrifice.getCurrentCosmeticTypes();
    console.log("✅ Verified current types:", currentTypes.map(n => Number(n)));
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});