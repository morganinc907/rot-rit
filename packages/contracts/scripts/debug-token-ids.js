const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("👤 User:", deployer.address);
    
    // Contract addresses from addresses.json
    const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    
    // Get the Relics contract
    const Relics = await ethers.getContractFactory("Relics");
    const relics = Relics.attach(relicsAddress);
    
    console.log("\n📊 Checking specific token IDs:");
    
    const tokensToCheck = [0, 1, 6, 7, 8, 9];
    
    for (const tokenId of tokensToCheck) {
        try {
            const balance = await relics.balanceOf(deployer.address, tokenId);
            console.log(`Token ID ${tokenId}: ${balance.toString()}`);
        } catch (error) {
            console.log(`Token ID ${tokenId}: Error - ${error.message.slice(0, 50)}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});