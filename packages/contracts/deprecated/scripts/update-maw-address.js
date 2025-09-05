const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🔧 Updating MawSacrifice address on Relics contract");
    
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const NEW_MAW_ADDRESS = "0xDCE4b7C0D351A1fce48Dd4037D82559fE8c16dC2";
    
    const Relics = await ethers.getContractFactory("Relics");
    const relics = Relics.attach(RELICS_ADDRESS);
    
    console.log("Relics Contract:", RELICS_ADDRESS);
    console.log("New MawSacrifice:", NEW_MAW_ADDRESS);
    console.log("Deployer:", deployer.address);
    
    try {
        console.log("\n📋 Current MawSacrifice address:");
        const currentMaw = await relics.mawSacrifice();
        console.log("Current:", currentMaw);
        
        console.log("\n🔄 Updating MawSacrifice address...");
        const tx = await relics.setMawSacrifice(NEW_MAW_ADDRESS, {
            gasLimit: 100000
        });
        
        console.log("Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
        
        // Verify the update
        console.log("\n✅ Verifying update...");
        const updatedMaw = await relics.mawSacrifice();
        console.log("Updated MawSacrifice:", updatedMaw);
        
        const isCorrect = updatedMaw.toLowerCase() === NEW_MAW_ADDRESS.toLowerCase();
        console.log("Address Match:", isCorrect ? "✅ SUCCESS" : "❌ FAILED");
        
        if (isCorrect) {
            console.log("\n🎉 MawSacrifice address successfully updated!");
            console.log("The new MawSacrifice contract can now burn relics.");
        }
        
    } catch (error) {
        console.error("❌ Error updating MawSacrifice address:", error.message);
    }
}

main().catch(console.error);