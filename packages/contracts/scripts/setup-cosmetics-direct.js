const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🎨 Setting up cosmetics directly (as owner)...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  console.log("\n📍 Contract Addresses:");
  console.log("MawSacrifice:", contractAddresses.MawSacrifice);
  console.log("Cosmetics:", contractAddresses.Cosmetics);
  
  // Get contracts
  const MawSacrifice = await hre.ethers.getContractAt(
    "MawSacrificeV4NoTimelock",
    contractAddresses.MawSacrifice
  );
  
  const Cosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2",
    contractAddresses.Cosmetics
  );
  
  // Verify ownership
  const cosmeticsOwner = await Cosmetics.owner();
  console.log("\n🔍 Ownership Check:");
  console.log("Cosmetics owner:", cosmeticsOwner);
  console.log("Current user:", deployer.address);
  
  if (cosmeticsOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("❌ Not the cosmetics contract owner");
    return;
  }
  
  // Define cosmetics to create (matching the working setup from session memory)
  const cosmeticsToCreate = [
    {
      name: "glasses",
      imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/glasses_layer.png",
      previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/glasses_layer.png",
      rarity: 1,
      slot: 1, // FACE
      maxSupply: 1000
    },
    {
      name: "strainer",
      imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/strainer_layer.png",
      previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/strainer_layer.png",
      rarity: 1,
      slot: 2, // BODY
      maxSupply: 1000
    },
    {
      name: "pink",
      imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink_layer.png",
      previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink_layer.png",
      rarity: 3,
      slot: 2, // BODY
      maxSupply: 1000
    },
    {
      name: "orange",
      imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/orange_layer.png",
      previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/orange_layer.png",
      rarity: 4,
      slot: 4, // BACKGROUND
      maxSupply: 1000
    },
    {
      name: "underpants",
      imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
      previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
      rarity: 2,
      slot: 2, // BODY
      maxSupply: 1000
    }
  ];
  
  console.log(`\n🔧 Creating ${cosmeticsToCreate.length} cosmetic types...`);
  
  // Create each cosmetic type
  for (let i = 0; i < cosmeticsToCreate.length; i++) {
    const cosmetic = cosmeticsToCreate[i];
    
    try {
      console.log(`\n⚙️ Creating cosmetic ${i + 1}: ${cosmetic.name}...`);
      console.log(`   Rarity: ${cosmetic.rarity}, Slot: ${cosmetic.slot}, Max Supply: ${cosmetic.maxSupply}`);
      
      const tx = await Cosmetics.createCosmeticType(
        cosmetic.name,
        cosmetic.imageURI,
        cosmetic.previewLayerURI,
        cosmetic.rarity,
        cosmetic.slot,
        1, // monthlySetId
        cosmetic.maxSupply
      );
      
      console.log(`📤 Transaction: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      console.log(`✅ Created! Gas used: ${receipt.gasUsed}`);
      
      // Parse events to get the type ID
      for (const log of receipt.logs) {
        try {
          const parsed = Cosmetics.interface.parseLog(log);
          if (parsed && parsed.name === 'CosmeticTypeCreated') {
            console.log(`🆔 Created with Type ID: ${parsed.args.typeId}`);
          }
        } catch {
          // Skip non-cosmetics events
        }
      }
      
    } catch (error) {
      console.error(`❌ Error creating ${cosmetic.name}:`, error.message);
      
      if (error.message.includes('Type exists')) {
        console.log(`   ✅ Type ${i + 1} already exists, continuing...`);
      }
    }
  }
  
  // Authorize MawSacrifice to use the cosmetics
  console.log("\n🔧 Authorizing MawSacrifice on cosmetics contract...");
  try {
    const tx = await Cosmetics.setContracts(
      contractAddresses.Raccoons,
      contractAddresses.MawSacrifice
    );
    
    console.log(`📤 Authorization transaction: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`✅ Authorization set! Gas used: ${receipt.gasUsed}`);
    
  } catch (error) {
    console.error("❌ Error setting authorization:", error.message);
  }
  
  // Set up cosmetic types in MawSacrifice
  console.log("\n🔧 Setting cosmetic types in MawSacrifice...");
  try {
    const typeIds = [1, 2, 3, 4, 5];
    const tx = await MawSacrifice.setCurrentCosmeticTypes(typeIds);
    
    console.log(`📤 Set cosmetic types transaction: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`✅ Cosmetic types set! Gas used: ${receipt.gasUsed}`);
    
  } catch (error) {
    console.error("❌ Error setting cosmetic types:", error.message);
  }
  
  // Verify the complete setup
  console.log("\n🔍 Verifying complete setup:");
  
  try {
    const availableTypes = await MawSacrifice.getCurrentCosmeticTypes();
    console.log("MawSacrifice available types:", availableTypes.map(t => Number(t)));
    
    console.log("\nCosmetic details:");
    for (let typeId = 1; typeId <= 5; typeId++) {
      try {
        const cosmeticInfo = await Cosmetics.getCosmeticInfo(typeId);
        console.log(`  Type ${typeId}: ${cosmeticInfo[0]} (slot: ${cosmeticInfo[4]}, rarity: ${cosmeticInfo[3]})`);
      } catch (err) {
        console.log(`  Type ${typeId}: Not configured`);
      }
    }
    
    // Check authorization
    const mawSacrificeRef = await Cosmetics.mawSacrifice();
    console.log(`\nCosmetics → MawSacrifice authorization: ${mawSacrificeRef}`);
    console.log(`Expected MawSacrifice: ${contractAddresses.MawSacrifice}`);
    
    if (mawSacrificeRef.toLowerCase() === contractAddresses.MawSacrifice.toLowerCase()) {
      console.log("✅ Authorization is correct!");
    } else {
      console.log("❌ Authorization mismatch!");
    }
    
  } catch (error) {
    console.error("❌ Error verifying setup:", error.message);
  }
  
  console.log("\n✅ Complete cosmetics setup finished!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});