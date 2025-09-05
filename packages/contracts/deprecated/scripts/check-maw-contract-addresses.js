const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking MawSacrifice contract addresses...\n");

    const MAW_ADDRESS = "0xDCE4b7C0D351A1fce48Dd4037D82559fE8c16dC2";

    const MawSacrifice = await ethers.getContractFactory("MawSacrificeV2Fixed");
    const maw = MawSacrifice.attach(MAW_ADDRESS);
    
    console.log("MawSacrifice:", MAW_ADDRESS);
    
    try {
        console.log("\n📋 Current contract addresses:");
        
        const relicsAddress = await maw.relics();
        console.log("Relics:", relicsAddress);
        
        const cosmeticsAddress = await maw.cosmetics();
        console.log("Cosmetics:", cosmeticsAddress);
        
        const demonsAddress = await maw.demons();
        console.log("Demons:", demonsAddress);
        
        const cultistsAddress = await maw.cultists();
        console.log("Cultists:", cultistsAddress);
        
        console.log("\n📋 Expected addresses:");
        console.log("Relics: 0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b");
        console.log("Cosmetics: 0xB0E32D26f6b61cB71115576e6a8d7De072e6310A");
        console.log("Demons: 0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF");
        console.log("Cultists: 0x2D7cD25A014429282062298d2F712FA7983154B9");
        
        console.log("\n✅ Matches:");
        console.log("Relics:", relicsAddress === "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b");
        console.log("Cosmetics:", cosmeticsAddress === "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A");
        console.log("Demons:", demonsAddress === "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF");
        console.log("Cultists:", cultistsAddress === "0x2D7cD25A014429282062298d2F712FA7983154B9");
        
        // Check current cosmetic types
        const currentTypes = await maw.getCurrentCosmeticTypes();
        console.log("\nCurrent cosmetic types:", currentTypes.map(x => x.toString()));
        
    } catch (error) {
        console.error("❌ Error checking addresses:", error.message);
    }
}

main().catch(console.error);