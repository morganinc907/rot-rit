const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🦝 Checking raccoon NFT balance...\n");

    const RACCOONS_ADDRESS = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";

    console.log("Raccoons Contract:", RACCOONS_ADDRESS);
    console.log("Account:", deployer.address);

    const Raccoons = await ethers.getContractFactory("Raccoons");
    const raccoons = Raccoons.attach(RACCOONS_ADDRESS);
    
    try {
        // Check if contract exists
        const code = await ethers.provider.getCode(RACCOONS_ADDRESS);
        console.log("Contract has code:", code.length > 2);
        
        // Check balance
        const balance = await raccoons.balanceOf(deployer.address);
        console.log("Raccoon NFT balance:", balance.toString());
        
        // Check total supply
        try {
            const totalSupply = await raccoons.totalSupply();
            console.log("Total raccoons minted:", totalSupply.toString());
        } catch (error) {
            console.log("No totalSupply function");
        }
        
        // If we have raccoons, get their token IDs
        if (balance > 0) {
            console.log("\n📋 Your raccoon token IDs:");
            for (let i = 0; i < Number(balance); i++) {
                try {
                    const tokenId = await raccoons.tokenOfOwnerByIndex(deployer.address, i);
                    console.log(`Token ${i}: #${tokenId.toString()}`);
                    
                    // Try to get token URI
                    try {
                        const tokenURI = await raccoons.tokenURI(tokenId);
                        console.log(`  URI: ${tokenURI}`);
                    } catch (error) {
                        console.log(`  URI: Not available`);
                    }
                } catch (error) {
                    console.log(`Token ${i}: Error getting ID - ${error.message}`);
                }
            }
        } else {
            console.log("\n❌ No raccoon NFTs found for this address");
            console.log("You need raccoon NFTs to convert to cultists");
        }
        
    } catch (error) {
        console.error("❌ Error checking raccoons:", error.message);
    }
}

main().catch(console.error);