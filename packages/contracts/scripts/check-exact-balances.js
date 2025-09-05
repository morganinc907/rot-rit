const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("👤 User:", deployer.address);
    
    // Contract addresses from addresses.json
    const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    
    // Get the Relics contract
    const Relics = await ethers.getContractFactory("Relics");
    const relics = Relics.attach(relicsAddress);
    
    // Token IDs
    const RUSTED_CAP = 0;
    const RUSTED_KEY = 1; 
    const GLASS_SHARD = 6;
    
    console.log("\n📊 Exact Token Balances:");
    
    try {
        const rustedCapBalance = await relics.balanceOf(deployer.address, RUSTED_CAP);
        console.log(`🧢 Rusted Caps (ID ${RUSTED_CAP}): ${rustedCapBalance.toString()}`);
        
        const rustedKeyBalance = await relics.balanceOf(deployer.address, RUSTED_KEY);
        console.log(`🗝️  Rusted Keys (ID ${RUSTED_KEY}): ${rustedKeyBalance.toString()}`);
        
        const glassShardBalance = await relics.balanceOf(deployer.address, GLASS_SHARD);
        console.log(`✨ Glass Shards (ID ${GLASS_SHARD}): ${glassShardBalance.toString()}`);
        
        // Check all token IDs 0-20 to be thorough
        console.log("\n🔍 All non-zero balances:");
        for (let i = 0; i <= 20; i++) {
            try {
                const balance = await relics.balanceOf(deployer.address, i);
                if (balance.gt(0)) {
                    console.log(`Token ID ${i}: ${balance.toString()}`);
                }
            } catch (error) {
                // Skip if error (token doesn't exist)
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