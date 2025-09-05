const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔧 Setting MawSacrifice authorization");
    console.log("Deployer address:", deployer.address);

    // Contract addresses
    const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const mawSacrificeAddress = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
    
    // Get contract instances
    const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
    
    console.log(`\n📋 Contract Addresses:`);
    console.log(`- Relics: ${relicsAddress}`);
    console.log(`- MawSacrifice: ${mawSacrificeAddress}`);
    
    // Set mawSacrifice address (this should grant burn authorization)
    console.log("\n🔧 Setting mawSacrifice address...");
    try {
        const tx = await relics.setMawSacrifice(mawSacrificeAddress);
        console.log(`📝 Transaction hash: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
        
        // Verify the change
        const newMawAddress = await relics.mawSacrifice();
        console.log(`\n🎯 New mawSacrifice address: ${newMawAddress}`);
        console.log(`✅ Status: ${newMawAddress.toLowerCase() === mawSacrificeAddress.toLowerCase() ? 'SUCCESS' : 'FAILED'}`);
        
    } catch (error) {
        console.log(`❌ Error setting mawSacrifice: ${error.message}`);
        if (error.data) {
            console.log(`Error data: ${error.data}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });