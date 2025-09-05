const hre = require("hardhat");

async function main() {
    const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
    
    console.log("Checking cosmetics in contract:", COSMETICS_ADDRESS);
    
    try {
        const CosmeticsV2 = await hre.ethers.getContractFactory("CosmeticsV2");
        const cosmetics = CosmeticsV2.attach(COSMETICS_ADDRESS);
        
        // Get current monthly set
        const currentSetId = await cosmetics.currentMonthlySetId();
        console.log("Current monthly set ID:", currentSetId.toString());
        
        // Check each cosmetic type
        for (let typeId = 1; typeId <= 5; typeId++) {
            try {
                const typeData = await cosmetics.cosmeticTypes(typeId);
                console.log(`\nCosmetic Type #${typeId}:`);
                console.log("  Name:", typeData.name);
                console.log("  Image URI:", typeData.imageURI);
                console.log("  Rarity:", typeData.rarity);
                console.log("  Slot:", typeData.slot);
                console.log("  Max Supply:", typeData.maxSupply.toString());
                console.log("  Current Supply:", typeData.currentSupply.toString());
                console.log("  Active:", typeData.active);
            } catch (err) {
                console.log(`Cosmetic Type #${typeId}: Not found`);
            }
        }
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

main().catch(console.error);