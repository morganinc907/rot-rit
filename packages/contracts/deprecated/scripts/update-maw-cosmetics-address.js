const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Updating MawSacrifice to use correct cosmetics contract...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Updating with account:", deployer.address);

    const MAW_ADDRESS = "0xDCE4b7C0D351A1fce48Dd4037D82559fE8c16dC2";
    const CORRECT_COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const DEMONS_ADDRESS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
    const CULTISTS_ADDRESS = "0x2D7cD25A014429282062298d2F712FA7983154B9";

    console.log("MawSacrifice:", MAW_ADDRESS);
    console.log("Correct Cosmetics:", CORRECT_COSMETICS_ADDRESS);

    const MawSacrifice = await ethers.getContractFactory("MawSacrificeV2Fixed");
    const maw = MawSacrifice.attach(MAW_ADDRESS);
    
    console.log("\n🔧 Updating contract addresses...");
    
    try {
        const tx = await maw.updateContracts(
            RELICS_ADDRESS,
            CORRECT_COSMETICS_ADDRESS,
            DEMONS_ADDRESS,
            CULTISTS_ADDRESS,
            {
                gasLimit: 200000
            }
        );
        
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
        
        // Verify the update
        const cosmeticsAddress = await maw.cosmetics();
        console.log("✅ Cosmetics address updated to:", cosmeticsAddress);
        console.log("Address correct:", cosmeticsAddress === CORRECT_COSMETICS_ADDRESS);
        
        // Now set up the cosmetics for sacrifices
        console.log("\n🎨 Setting up cosmetic types for sacrifices...");
        const validTypes = [1, 2, 3, 4, 5]; // All 5 cosmetic types
        
        const tx2 = await maw.setMonthlyCosmetics(1, validTypes, {
            gasLimit: 200000
        });
        
        console.log("Cosmetics setup transaction:", tx2.hash);
        const receipt2 = await tx2.wait();
        console.log("✅ Cosmetics configured! Block:", receipt2.blockNumber);
        
        const currentTypes = await maw.getCurrentCosmeticTypes();
        console.log("✅ Available cosmetic types:", currentTypes.map(x => x.toString()));
        
    } catch (error) {
        console.error("❌ Error updating contracts:", error.message);
    }
}

main().catch(console.error);