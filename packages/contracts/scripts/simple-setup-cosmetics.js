const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🎨 Setting up cosmetics on NEW contract...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  const newCosmeticsAddress = contractAddresses.CosmeticsV2_NEW;
  console.log("New Cosmetics:", newCosmeticsAddress);
  
  const NewCosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2", 
    newCosmeticsAddress
  );
  
  // Check if we're the owner
  try {
    const owner = await NewCosmetics.owner();
    console.log("Contract owner:", owner);
    console.log("Current user:", deployer.address);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ Not the contract owner - cannot create cosmetic types");
      return;
    }
  } catch (err) {
    console.error("❌ Error checking owner:", err.message);
    return;
  }
  
  // Define the cosmetics to create (matching old contract)
  const cosmeticsToCreate = [
    {
      name: "glasses",
      imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/glasses_layer.png",
      previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/glasses_layer.png",
      rarity: 1,
      slot: 2, // BODY
      maxSupply: 1000
    },
    {
      name: "strainer",
      imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/strainer_layer.png",
      previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/strainer_layer.png",
      rarity: 1, // Fixed from 0 to 1
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
      slot: 2, // BODY (legs might not exist, use body)
      maxSupply: 1000
    }
  ];
  
  console.log(`\n🔧 Creating ${cosmeticsToCreate.length} cosmetic types...`);
  
  for (let i = 0; i < cosmeticsToCreate.length; i++) {
    const cosmetic = cosmeticsToCreate[i];
    
    try {
      console.log(`\n⚙️ Creating cosmetic ${i + 1}: ${cosmetic.name}...`);
      console.log(`   Rarity: ${cosmetic.rarity}, Slot: ${cosmetic.slot}, Max Supply: ${cosmetic.maxSupply}`);
      
      const tx = await NewCosmetics.createCosmeticType(
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
      
      // Extract the typeId from the event
      const event = receipt.logs.find(log => {
        try {
          return log.topics[0] === hre.ethers.id("CosmeticTypeCreated(uint256,string,uint8,uint8)");
        } catch {
          return false;
        }
      });
      
      if (event) {
        const typeId = hre.ethers.getBigInt(event.topics[1]);
        console.log(`🆔 Created with Type ID: ${typeId}`);
      }
      
    } catch (error) {
      console.error(`❌ Error creating ${cosmetic.name}:`, error.message);
    }
  }
  
  // Verify all created cosmetics
  console.log("\n🔍 Verifying created cosmetics:");
  for (let typeId = 1; typeId <= 10; typeId++) {
    try {
      const cosmeticInfo = await NewCosmetics.getCosmeticInfo(typeId);
      console.log(`  Type ${typeId}: ${cosmeticInfo[0]} (slot: ${cosmeticInfo[3]}, rarity: ${cosmeticInfo[4]})`);
    } catch (err) {
      // Type doesn't exist, skip
    }
  }
  
  console.log("\n✅ Cosmetics setup complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});