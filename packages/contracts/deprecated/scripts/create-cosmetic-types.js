async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Creating cosmetic types with account:", deployer.address);
    
    const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
    
    try {
        const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2");
        const cosmetics = CosmeticsV2.attach(COSMETICS_ADDRESS);
        
        // Sample cosmetic types to create
        const cosmeticTypes = [
            {
                name: "glasses",
                imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/glasses.png",
                previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/glasses_layer.png", 
                rarity: 2, // Uncommon
                slot: 1, // FACE
                monthlySetId: 1,
                maxSupply: 1000
            },
            {
                name: "strainer",
                imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/strainer.png",
                previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/strainer_layer.png",
                rarity: 3, // Rare
                slot: 0, // HEAD
                monthlySetId: 1,
                maxSupply: 1000
            },
            {
                name: "pink",
                imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink.png", 
                previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink_layer.png",
                rarity: 3, // Rare
                slot: 3, // FUR
                monthlySetId: 1,
                maxSupply: 1000
            },
            {
                name: "orange",
                imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/orange.png",
                previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink_layer.png",
                rarity: 4, // Epic
                slot: 4, // BACKGROUND
                monthlySetId: 1,
                maxSupply: 10
            },
            {
                name: "underpants",
                imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants.png",
                previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
                rarity: 5, // Legendary
                slot: 2, // BODY
                monthlySetId: 1,
                maxSupply: 5
            }
        ];
        
        console.log(`Creating ${cosmeticTypes.length} cosmetic types...`);
        
        for (let i = 0; i < cosmeticTypes.length; i++) {
            const type = cosmeticTypes[i];
            console.log(`\nCreating: ${type.name} (Rarity: ${type.rarity}, Slot: ${type.slot})`);
            
            try {
                const tx = await cosmetics.createCosmeticType(
                    type.name,
                    type.imageURI,
                    type.previewLayerURI,
                    type.rarity,
                    type.slot,
                    type.monthlySetId,
                    type.maxSupply
                );
                
                await tx.wait();
                const typeId = i + 1; // Type IDs start from 1
                console.log(`✅ Created cosmetic type ID ${typeId}: ${type.name}`);
                
            } catch (error) {
                console.error(`❌ Failed to create ${type.name}:`, error.message);
            }
        }
        
        console.log("\n🎉 Cosmetic type creation complete!");
        console.log("\nNext steps:");
        console.log("1. Upload cosmetic images to IPFS and update imageURI values");
        console.log("2. Ensure MawSacrifice contract is set as minter");
        console.log("3. Fund Chainlink VRF subscription");
        console.log("4. Test ritual summoning in frontend");
        
    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error);