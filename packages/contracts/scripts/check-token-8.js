const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("👤 User:", deployer.address);
    
    // Contract addresses from addresses.json
    const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    
    // Get the Relics contract
    const Relics = await ethers.getContractFactory("Relics");
    const relics = Relics.attach(relicsAddress);
    
    console.log("\n📊 Token ID 8 Balance:");
    
    try {
        const balance8 = await relics.balanceOf(deployer.address, 8);
        console.log(`Token ID 8: ${balance8.toString()}`);
        
        // Let's check a few more IDs around there
        for (let i = 7; i <= 10; i++) {
            try {
                const balance = await relics.balanceOf(deployer.address, i);
                if (balance.gt(0)) {
                    console.log(`Token ID ${i}: ${balance.toString()}`);
                }
            } catch (error) {
                console.log(`Token ID ${i}: Error - ${error.message.slice(0, 50)}`);
            }
        }
        
    } catch (error) {
        console.error("Error checking balances:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});