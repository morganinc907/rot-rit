const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🔍 Checking cultist NFT balance...\n");

    const CULTISTS_ADDRESS = "0x2D7cD25A014429282062298d2F712FA7983154B9";

    console.log("Cultists Contract:", CULTISTS_ADDRESS);
    console.log("Account:", deployer.address);

    const Cultists = await ethers.getContractFactory("Cultists");
    const cultists = Cultists.attach(CULTISTS_ADDRESS);
    
    try {
        // Check if contract exists
        const code = await ethers.provider.getCode(CULTISTS_ADDRESS);
        console.log("Contract has code:", code.length > 2);
        
        // Check balance
        const balance = await cultists.balanceOf(deployer.address);
        console.log("Cultist NFT balance:", balance.toString());
        
        // Check total supply
        try {
            const totalSupply = await cultists.totalSupply();
            console.log("Total cultists minted:", totalSupply.toString());
        } catch (error) {
            console.log("No totalSupply function");
        }
        
        // If we have cultists, get their token IDs
        if (balance > 0) {
            console.log("\n📋 Your cultist token IDs:");
            for (let i = 0; i < Number(balance); i++) {
                try {
                    const tokenId = await cultists.tokenOfOwnerByIndex(deployer.address, i);
                    console.log(`Token ${i}: #${tokenId.toString()}`);
                    
                    // Try to get token URI
                    try {
                        const tokenURI = await cultists.tokenURI(tokenId);
                        console.log(`  URI: ${tokenURI}`);
                    } catch (error) {
                        console.log(`  URI: Not available`);
                    }
                } catch (error) {
                    console.log(`Token ${i}: Error getting ID - ${error.message}`);
                }
            }
        } else {
            console.log("\n❌ No cultist NFTs found for this address");
            console.log("You need cultist NFTs to perform demon sacrifices");
        }
        
    } catch (error) {
        console.error("❌ Error checking cultists:", error.message);
    }
}

main().catch(console.error);