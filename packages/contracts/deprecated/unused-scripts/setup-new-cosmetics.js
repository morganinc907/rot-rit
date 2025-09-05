const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🎨 Setting up cosmetic types on new contract...");
  console.log("User:", signer.address);
  console.log("New Cosmetics:", addresses.baseSepolia.Cosmetics);
  console.log("");

  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", addresses.baseSepolia.Cosmetics);

    // Create cosmetic types (new signature: name, imageURI, previewLayerURI, rarity, slot, monthlySetId, maxSupply)
    const cosmeticTypes = [
      { name: "glasses", slot: 1, rarity: 1 }, // Face, Common
      { name: "strainer", slot: 2, rarity: 1 }, // Body, Common (was 0)  
      { name: "pink", slot: 2, rarity: 3 }, // Body, Rare
      { name: "orange", slot: 5, rarity: 4 }, // Background, Epic
      { name: "underpants", slot: 4, rarity: 2 } // Legs, Uncommon
    ];

    console.log("📋 Creating cosmetic types...");
    const createdTypes = [];
    
    for (const type of cosmeticTypes) {
      console.log(`Creating: ${type.name} (slot ${type.slot}, rarity ${type.rarity})`);
      
      const tx = await cosmetics.createCosmeticType(
        type.name,
        `${type.name}.png`, // imageURI
        `${type.name}_preview.png`, // previewLayerURI
        type.rarity,
        type.slot, 
        1, // monthlySetId
        1000 // maxSupply
      );
      
      const receipt = await tx.wait();
      
      // Try to get the created type ID from event logs
      const event = receipt.logs.find(log => log.topics[0] === hre.ethers.id("CosmeticTypeCreated(uint256,string,uint8,uint8,uint256,uint256)"));
      let typeId = createdTypes.length + 1; // fallback
      
      if (event) {
        typeId = Number(event.topics[1]);
      }
      
      createdTypes.push(typeId);
      console.log(`✅ Created type ${typeId}: ${type.name}`);
    }

    console.log("");
    console.log("🗓️ Setting up monthly cosmetic set...");
    console.log("Created type IDs:", createdTypes);
    
    // Connect to MawSacrifice to set monthly cosmetics
    const mawSacrifice = await hre.ethers.getContractAt(
      "MawSacrificeV4NoTimelock", 
      addresses.baseSepolia.MawSacrifice
    );
    
    const monthlySetTx = await mawSacrifice.setMonthlyCosmeticTypes(createdTypes);
    await monthlySetTx.wait();
    console.log("✅ Monthly cosmetic set configured:", createdTypes);
    
    console.log("");
    console.log("🔍 Verifying setup...");
    
    // Check current cosmetic types
    const currentTypes = await mawSacrifice.getCurrentCosmeticTypes();
    console.log("Current cosmetic types:", currentTypes.map(n => Number(n)));
    
    // Check one cosmetic info
    const type1Info = await cosmetics.getCosmeticInfo(1);
    console.log("Type 1 (glasses):", {
      name: type1Info[0],
      slot: Number(type1Info[3]),
      rarity: Number(type1Info[4])
    });
    
    console.log("");
    console.log("✅ NEW COSMETICS CONTRACT FULLY CONFIGURED!");
    console.log("📋 Ready for testing cosmetic sacrifices");
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.message.includes("Type already exists")) {
      console.log("💡 Some types may already exist - this is normal");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});