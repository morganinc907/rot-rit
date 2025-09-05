const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("👹 Checking demon NFT balance...\n");

    const DEMONS_ADDRESS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";

    console.log("Demons Contract:", DEMONS_ADDRESS);
    console.log("Account:", deployer.address);

    try {
        // Check if contract has code
        const code = await ethers.provider.getCode(DEMONS_ADDRESS);
        console.log("Contract has code:", code !== '0x');

        const Demons = await ethers.getContractFactory("Demons");
        const demons = Demons.attach(DEMONS_ADDRESS);
        
        const balance = await demons.balanceOf(deployer.address);
        console.log("Demon NFT balance:", balance.toString());
        
        if (balance > 0) {
            console.log("\n📋 Your demon token IDs:");
            for (let i = 0; i < Number(balance); i++) {
                try {
                    const tokenId = await demons.tokenOfOwnerByIndex(deployer.address, i);
                    const uri = await demons.tokenURI(tokenId);
                    console.log(`Token ${i}: #${tokenId}`);
                    console.log(`  URI: ${uri}`);
                } catch (error) {
                    console.log(`Token ${i}: Error getting token - ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error("❌ Error checking demon balance:", error.message);
    }
}

main().catch(console.error);