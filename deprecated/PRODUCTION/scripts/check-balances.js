const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Checking balances for account:", deployer.address);
    
    // Contract addresses from deployment status
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    
    // Get the Relics contract
    const Relics = await ethers.getContractFactory("Relics");
    const relics = Relics.attach(RELICS_ADDRESS);
    
    console.log("\n📊 CHECKING ON-CHAIN BALANCES:");
    console.log("=".repeat(50));
    
    try {
        // Check balance of each relic type
        const relicTypes = {
            1: "Rusted Keys",
            2: "Lantern Fragment", 
            3: "Worm-eaten Mask",
            4: "Bone Dagger",
            5: "Ash Vial",
            6: "Binding Contract",
            7: "Soul Deed",
            8: "Ashes"
        };
        
        for (const [id, name] of Object.entries(relicTypes)) {
            try {
                const balance = await relics.balanceOf(deployer.address, id);
                console.log(`${name} (ID ${id}): ${balance.toString()}`);
            } catch (error) {
                console.log(`${name} (ID ${id}): ERROR - ${error.message}`);
            }
        }
        
        console.log("\n" + "=".repeat(50));
        
    } catch (error) {
        console.error("❌ Error checking balances:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});