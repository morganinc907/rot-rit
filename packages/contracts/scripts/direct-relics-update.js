const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔧 Direct Relics Update with Higher Gas");
    console.log("=======================================");
    
    const [signer] = await hre.ethers.getSigners();
    const networkAddresses = addresses[hre.network.name];
    
    const NEW_MAW = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
    const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
    
    console.log(`Signer: ${signer.address}`);
    console.log(`New Maw: ${NEW_MAW}`);
    console.log(`Relics: ${networkAddresses.Relics}`);
    
    // Check current state
    const currentMaw = await relics.mawSacrifice();
    console.log(`\nCurrent state:`);
    console.log(`- mawSacrifice(): ${currentMaw}`);
    console.log(`- Needs update: ${currentMaw.toLowerCase() !== NEW_MAW.toLowerCase() ? '✅' : '❌ Already correct'}`);
    
    if (currentMaw.toLowerCase() === NEW_MAW.toLowerCase()) {
        console.log(`✅ Relics already points to new Maw!`);
        return;
    }
    
    try {
        console.log(`\n🔄 Updating Relics with higher gas...`);
        console.log(`This will automatically grant MAW_ROLE to the new Maw.`);
        
        const tx = await relics.setMawSacrifice(NEW_MAW, {
            gasLimit: 300000,
            gasPrice: hre.ethers.parseUnits("3", "gwei") // Even higher gas price
        });
        
        console.log(`Transaction: ${tx.hash}`);
        console.log(`⏳ Waiting for confirmation...`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed}`);
        
        // Verify
        const newMaw = await relics.mawSacrifice();
        console.log(`\n🔍 Verification:`);
        console.log(`New mawSacrifice(): ${newMaw}`);
        console.log(`Expected: ${NEW_MAW}`);
        console.log(`Success: ${newMaw.toLowerCase() === NEW_MAW.toLowerCase() ? '✅' : '❌'}`);
        
        if (newMaw.toLowerCase() === NEW_MAW.toLowerCase()) {
            console.log(`🎉 Relics successfully updated!`);
            console.log(`✅ MAW_ROLE automatically granted to new Maw`);
            console.log(`✅ New Maw can now burn fragments from Relics`);
        }
        
    } catch (error) {
        console.log(`❌ Update failed: ${error.message}`);
        
        if (error.message.includes("underpriced")) {
            console.log(`💡 Still underpriced. Wait a few minutes for mempool to clear.`);
        }
        
        if (error.message.includes("nonce")) {
            console.log(`💡 Nonce issue - there might be pending transactions.`);
        }
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});