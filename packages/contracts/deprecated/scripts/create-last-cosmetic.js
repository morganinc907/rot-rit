async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Creating remaining cosmetic type with account:", deployer.address);
    
    const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
    
    try {
        const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2");
        const cosmetics = CosmeticsV2.attach(COSMETICS_ADDRESS);
        
        // Create the underpants cosmetic that failed
        const type = {
            name: "underpants",
            imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants.png",
            previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
            rarity: 5, // Legendary
            slot: 2, // BODY
            monthlySetId: 1,
            maxSupply: 5
        };
        
        console.log(`Creating: ${type.name} (Rarity: ${type.rarity}, Slot: ${type.slot})`);
        
        const tx = await cosmetics.createCosmeticType(
            type.name,
            type.imageURI,
            type.previewLayerURI,
            type.rarity,
            type.slot,
            type.monthlySetId,
            type.maxSupply,
            {
                maxFeePerGas: ethers.parseUnits("20", "gwei"),
                maxPriorityFeePerGas: ethers.parseUnits("5", "gwei"),
            }
        );
        
        await tx.wait();
        console.log(`✅ Created cosmetic type ID 5: ${type.name}`);
        console.log("\n🎉 All cosmetic types created!");
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

main().catch(console.error);