const { ethers } = require("hardhat");

async function main() {
    console.log("🎨 Setting up cosmetics for MawSacrificeV2Fixed...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Setting up with account:", deployer.address);

    const MAW_ADDRESS = "0xDCE4b7C0D351A1fce48Dd4037D82559fE8c16dC2";
    const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";

    console.log("MawSacrifice:", MAW_ADDRESS);
    console.log("Cosmetics:", COSMETICS_ADDRESS);

    // First check what cosmetic types exist
    const Cosmetics = await ethers.getContractFactory("CosmeticsV2");
    const cosmetics = Cosmetics.attach(COSMETICS_ADDRESS);
    
    console.log("\n📋 Checking existing cosmetics...");
    const currentSetId = await cosmetics.currentMonthlySetId();
    console.log("Current monthly set ID:", currentSetId.toString());
    
    // Check cosmetic types 1-5
    const validTypes = [];
    for (let i = 1; i <= 5; i++) {
        try {
            const typeData = await cosmetics.cosmeticTypes(i);
            if (typeData[8]) { // active
                console.log(`Cosmetic ${i}: ${typeData[0]} (${typeData[8] ? "active" : "inactive"})`);
                validTypes.push(i);
            }
        } catch (error) {
            console.log(`Cosmetic ${i}: Not found`);
        }
    }
    
    if (validTypes.length === 0) {
        console.log("❌ No valid cosmetic types found!");
        return;
    }
    
    // Set up cosmetics on MawSacrifice contract
    const MawSacrifice = await ethers.getContractFactory("MawSacrificeV2Fixed");
    const maw = MawSacrifice.attach(MAW_ADDRESS);
    
    console.log("\n🔧 Setting monthly cosmetics on MawSacrifice...");
    console.log("Valid cosmetic types:", validTypes);
    
    try {
        const tx = await maw.setMonthlyCosmetics(currentSetId, validTypes, {
            gasLimit: 200000
        });
        
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
        
        // Verify it was set
        const currentTypes = await maw.getCurrentCosmeticTypes();
        console.log("✅ Cosmetic types set on MawSacrifice:", currentTypes.map(x => x.toString()));
        
    } catch (error) {
        console.error("❌ Error setting cosmetics:", error.message);
    }
}

main().catch(console.error);