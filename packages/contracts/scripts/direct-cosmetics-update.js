const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔧 Direct Cosmetics Update with Higher Gas");
    console.log("==========================================");
    
    const [signer] = await hre.ethers.getSigners();
    const networkAddresses = addresses[hre.network.name];
    
    const NEW_MAW = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", networkAddresses.Cosmetics);
    
    console.log(`Signer: ${signer.address}`);
    console.log(`New Maw: ${NEW_MAW}`);
    console.log(`Cosmetics: ${networkAddresses.Cosmetics}`);
    
    // Check current state
    const currentMaw = await cosmetics.mawSacrifice();
    const raccoons = await cosmetics.raccoons();
    console.log(`\nCurrent state:`);
    console.log(`- mawSacrifice(): ${currentMaw}`);
    console.log(`- raccoons(): ${raccoons}`);
    console.log(`- Needs update: ${currentMaw.toLowerCase() !== NEW_MAW.toLowerCase() ? '✅' : '❌ Already correct'}`);
    
    if (currentMaw.toLowerCase() === NEW_MAW.toLowerCase()) {
        console.log(`✅ Cosmetics already points to new Maw!`);
        return;
    }
    
    try {
        console.log(`\n🔄 Updating Cosmetics with higher gas...`);
        const tx = await cosmetics.setContracts(raccoons, NEW_MAW, {
            gasLimit: 200000,
            gasPrice: hre.ethers.parseUnits("2", "gwei") // Higher gas price
        });
        
        console.log(`Transaction: ${tx.hash}`);
        console.log(`⏳ Waiting for confirmation...`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed}`);
        
        // Verify
        const newMaw = await cosmetics.mawSacrifice();
        console.log(`\n🔍 Verification:`);
        console.log(`New mawSacrifice(): ${newMaw}`);
        console.log(`Expected: ${NEW_MAW}`);
        console.log(`Success: ${newMaw.toLowerCase() === NEW_MAW.toLowerCase() ? '✅' : '❌'}`);
        
        if (newMaw.toLowerCase() === NEW_MAW.toLowerCase()) {
            console.log(`🎉 Cosmetics successfully updated to trust new Maw!`);
        }
        
    } catch (error) {
        console.log(`❌ Update failed: ${error.message}`);
        
        if (error.message.includes("underpriced")) {
            console.log(`💡 Try increasing gas price further or wait for pending transactions to clear.`);
        }
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});