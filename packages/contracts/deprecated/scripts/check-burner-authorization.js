const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Checking burner authorization for:", deployer.address);
    
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const MAW_SACRIFICE_ADDRESS = "0x6E62A606b5950c4B92F626b32AaFF2436E20A7bb";
    
    const Relics = await ethers.getContractFactory("Relics");
    const relics = Relics.attach(RELICS_ADDRESS);
    
    console.log("\n🔍 CHECKING BURNER AUTHORIZATION:");
    console.log("=".repeat(60));
    console.log("Relics Contract:", RELICS_ADDRESS);
    console.log("MawSacrifice Contract:", MAW_SACRIFICE_ADDRESS);
    
    try {
        // Check if MawSacrifice contract is authorized to burn
        const isBurner = await relics.isBurner(MAW_SACRIFICE_ADDRESS);
        console.log("\n🔥 MawSacrifice Burner Status:", isBurner ? "✅ AUTHORIZED" : "❌ NOT AUTHORIZED");
        
        if (!isBurner) {
            console.log("\n💡 SOLUTION: MawSacrifice contract needs to be set as burner!");
            console.log("The Relics contract owner needs to call setBurner(mawSacrificeAddress, true)");
        } else {
            console.log("✅ MawSacrifice is properly authorized to burn tokens.");
        }
        
        // Also check who the owner of the Relics contract is
        const owner = await relics.owner();
        console.log("\n👤 Relics Contract Owner:", owner);
        console.log("👤 Current Deployer:", deployer.address);
        console.log("🔑 Can set burner:", owner === deployer.address ? "YES" : "NO");
        
    } catch (error) {
        console.error("❌ Error checking burner authorization:", error.message);
    }
    
    console.log("=".repeat(60));
}

main().catch(console.error);