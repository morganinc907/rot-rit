const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Checking MawSacrifice address on Relics contract");
    
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const EXPECTED_MAW_ADDRESS = "0x6E62A606b5950c4B92F626b32AaFF2436E20A7bb";
    
    const Relics = await ethers.getContractFactory("Relics");
    const relics = Relics.attach(RELICS_ADDRESS);
    
    console.log("\n🔍 CHECKING MAW ADDRESS ON RELICS:");
    console.log("=".repeat(60));
    console.log("Relics Contract:", RELICS_ADDRESS);
    console.log("Expected MawSacrifice:", EXPECTED_MAW_ADDRESS);
    
    try {
        const currentMawAddress = await relics.mawSacrifice();
        console.log("Current MawSacrifice on Relics:", currentMawAddress);
        
        const isCorrect = currentMawAddress.toLowerCase() === EXPECTED_MAW_ADDRESS.toLowerCase();
        console.log("\n🎯 Address Match:", isCorrect ? "✅ CORRECT" : "❌ INCORRECT");
        
        if (!isCorrect) {
            console.log("\n💡 SOLUTION: Need to update MawSacrifice address on Relics contract!");
            console.log("Call relics.setMawSacrifice('" + EXPECTED_MAW_ADDRESS + "')");
        } else {
            console.log("✅ MawSacrifice address is correctly set on Relics contract.");
        }
        
        // Also check ritual address for completeness
        const ritualAddress = await relics.ritual();
        console.log("\n📚 Other authorized addresses:");
        console.log("Ritual Address:", ritualAddress);
        
        // Check contract owner
        const owner = await relics.owner();
        console.log("Relics Owner:", owner);
        console.log("Current Deployer:", deployer.address);
        console.log("Can update addresses:", owner === deployer.address ? "YES" : "NO");
        
    } catch (error) {
        console.error("❌ Error checking MawSacrifice address:", error.message);
    }
    
    console.log("=".repeat(60));
}

main().catch(console.error);