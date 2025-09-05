const { ethers } = require("hardhat");

async function main() {
    console.log("🎨 Creating cosmetic types for the Store...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Creating with account:", deployer.address);

    const COSMETICS_ADDRESS = "0x8184FdB709f6B810d94d4Ed2b6196866EF604e68";

    const Cosmetics = await ethers.getContractFactory("CosmeticsV2");
    const cosmetics = Cosmetics.attach(COSMETICS_ADDRESS);
    
    console.log("Cosmetics Contract:", COSMETICS_ADDRESS);

    // Define cosmetic types for the store
    const cosmeticTypes = [
        {
            name: "Stylish Glasses",
            imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/glasses.png",
            previewLayerURI: "",
            rarity: 2, // Uncommon
            slot: 1,   // Eyes
            monthlySetId: 1,
            maxSupply: 1000
        },
        {
            name: "Strainer Hat",
            imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/strainer.png", 
            previewLayerURI: "",
            rarity: 3, // Rare
            slot: 0,   // Head
            monthlySetId: 1,
            maxSupply: 1000
        },
        {
            name: "Pink Fur",
            imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink.png",
            previewLayerURI: "",
            rarity: 3, // Rare
            slot: 3,   // Body
            monthlySetId: 1,
            maxSupply: 1000
        },
        {
            name: "Orange Glow",
            imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/orange.png",
            previewLayerURI: "",
            rarity: 4, // Epic
            slot: 4,   // Special
            monthlySetId: 1,
            maxSupply: 100
        },
        {
            name: "Legendary Underpants",
            imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants.png",
            previewLayerURI: "",
            rarity: 5, // Legendary
            slot: 2,   // Legs
            monthlySetId: 1,
            maxSupply: 10
        }
    ];

    console.log("📋 Creating cosmetic types...");

    for (let i = 0; i < cosmeticTypes.length; i++) {
        const cosmetic = cosmeticTypes[i];
        const typeId = i + 1;
        
        try {
            console.log(`\nCreating cosmetic ${typeId}: ${cosmetic.name}`);
            
            const tx = await cosmetics.createCosmeticType(
                cosmetic.name,
                cosmetic.imageURI,
                cosmetic.previewLayerURI,
                cosmetic.rarity,
                cosmetic.slot,
                cosmetic.monthlySetId,
                cosmetic.maxSupply,
                {
                    gasLimit: 300000
                }
            );
            
            console.log("Transaction sent:", tx.hash);
            const receipt = await tx.wait();
            console.log("✅ Cosmetic created! Block:", receipt.blockNumber);
            
        } catch (error) {
            console.error(`❌ Error creating cosmetic ${typeId}:`, error.message);
        }
    }
    
    console.log("\n🎉 All cosmetics created!");
    console.log("The Store page should now display all cosmetic types.");
}

main().catch(console.error);