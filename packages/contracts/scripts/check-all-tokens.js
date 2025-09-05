const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("👤 User:", deployer.address);
    
    // Contract addresses from addresses.json
    const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    
    // Get the Relics contract
    const Relics = await ethers.getContractFactory("Relics");
    const relics = Relics.attach(relicsAddress);
    
    console.log("\n📊 Complete Token Inventory:");
    
    // Check tokens 0-15 to be thorough
    for (let tokenId = 0; tokenId <= 15; tokenId++) {
        try {
            const balance = await relics.balanceOf(deployer.address, tokenId);
            const balanceNum = Number(balance.toString());
            if (balanceNum > 0) {
                console.log(`Token ID ${tokenId}: ${balanceNum}`);
            }
        } catch (error) {
            // Skip errors (tokens that don't exist)
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});