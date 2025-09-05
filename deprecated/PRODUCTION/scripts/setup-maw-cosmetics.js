const { ethers } = require("hardhat");

async function main() {
    console.log("🎨 Direct cosmetics setup for MawSacrifice...\n");

    const [deployer] = await ethers.getSigners();
    const MAW_ADDRESS = "0xDCE4b7C0D351A1fce48Dd4037D82559fE8c16dC2";

    const MawSacrifice = await ethers.getContractFactory("MawSacrificeV2Fixed");
    const maw = MawSacrifice.attach(MAW_ADDRESS);
    
    try {
        console.log("Setting cosmetic types [1,2,3,4,5] for monthly set 1...");
        
        const tx = await maw.setMonthlyCosmetics(1, [1, 2, 3, 4, 5], {
            gasLimit: 300000
        });
        
        console.log("Transaction:", tx.hash);
        const receipt = await tx.wait();
        console.log("Confirmed in block:", receipt.blockNumber);
        
        // Check result
        const types = await maw.getCurrentCosmeticTypes();
        console.log("Result:", types.map(x => Number(x)));
        
    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error);