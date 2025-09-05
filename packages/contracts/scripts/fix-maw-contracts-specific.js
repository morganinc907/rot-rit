const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔧 Fixing Maw Contracts with Current Addresses");
    console.log("==============================================");
    
    const networkName = hre.network.name;
    const networkAddresses = addresses[networkName];
    
    const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrificeV4NoTimelock);
    
    // Get current addresses from Maw
    console.log(`\n🔍 Current Maw contract addresses:`);
    const currentRelics = await mawSacrifice.relics();
    const currentCosmetics = await mawSacrifice.cosmetics();
    
    console.log(`- relics(): ${currentRelics}`);
    console.log(`- cosmetics(): ${currentCosmetics}`);
    
    // Try to get current demons/cultists, or use from addresses.json
    let demons = networkAddresses.Demons || "0x0000000000000000000000000000000000000000";
    let cultists = networkAddresses.Cultists || "0x0000000000000000000000000000000000000000";
    
    try {
        demons = await mawSacrifice.demons();
        console.log(`- demons(): ${demons}`);
    } catch (e) {
        console.log(`- demons(): Not accessible, using ${demons}`);
    }
    
    try {
        cultists = await mawSacrifice.cultists();  
        console.log(`- cultists(): ${cultists}`);
    } catch (e) {
        console.log(`- cultists(): Not accessible, using ${cultists}`);
    }
    
    console.log(`\n🎯 Target addresses:`);
    console.log(`- Relics: ${networkAddresses.Relics} ${currentRelics.toLowerCase() === networkAddresses.Relics.toLowerCase() ? '✅' : '❌'}`);
    console.log(`- Cosmetics: ${networkAddresses.Cosmetics} ${currentCosmetics.toLowerCase() === networkAddresses.Cosmetics.toLowerCase() ? '✅' : '❌'}`);
    console.log(`- Demons: ${demons}`);
    console.log(`- Cultists: ${cultists}`);
    
    if (currentCosmetics.toLowerCase() === networkAddresses.Cosmetics.toLowerCase()) {
        console.log(`\n✅ Maw already points to correct Cosmetics!`);
        return;
    }
    
    try {
        console.log(`\n🔄 Calling setContracts...`);
        const tx = await mawSacrifice.setContracts(
            networkAddresses.Relics,      // Keep relics the same
            networkAddresses.Cosmetics,   // Fix cosmetics pointer
            demons,                       // Keep demons the same
            cultists                      // Keep cultists the same  
        );
        console.log(`Transaction hash: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ setContracts succeeded in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed}`);
        
        // Verify the change
        const newCosmetics = await mawSacrifice.cosmetics();
        console.log(`\n🔍 Verification:`);
        console.log(`New cosmetics address: ${newCosmetics}`);
        console.log(`Correct: ${newCosmetics.toLowerCase() === networkAddresses.Cosmetics.toLowerCase() ? '✅' : '❌'}`);
        
    } catch (error) {
        console.log(`❌ setContracts failed: ${error.message}`);
        
        // Try to get more specific error info
        if (error.data && error.data !== '0x') {
            console.log(`Error data: ${error.data}`);
        }
        
        if (error.reason) {
            console.log(`Reason: ${error.reason}`);
        }
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});