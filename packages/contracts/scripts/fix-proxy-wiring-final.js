const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔧 Fixing Proxy Wiring - Final Attempt");
    console.log("======================================");
    
    const [signer] = await hre.ethers.getSigners();
    const networkName = hre.network.name;
    const networkAddresses = addresses[networkName];
    
    const proxyAddress = networkAddresses.MawSacrificeV4NoTimelock;
    const maw = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", proxyAddress);
    
    console.log(`Signer: ${signer.address}`);
    console.log(`Proxy: ${proxyAddress}`);
    
    // Get current addresses  
    const currentCosmetics = await maw.cosmetics();
    const currentRelics = await maw.relics();
    const currentDemons = await maw.demons();
    const currentCultists = await maw.cultists();
    
    console.log(`\n📋 Current Wiring:`);
    console.log(`- Cosmetics: ${currentCosmetics} ${currentCosmetics.toLowerCase() === networkAddresses.Cosmetics.toLowerCase() ? '✅' : '❌'}`);
    console.log(`- Relics: ${currentRelics} ${currentRelics.toLowerCase() === networkAddresses.Relics.toLowerCase() ? '✅' : '✅'}`);
    console.log(`- Demons: ${currentDemons}`);
    console.log(`- Cultists: ${currentCultists}`);
    
    console.log(`\n🎯 Target Addresses:`);
    console.log(`- Relics: ${networkAddresses.Relics}`);
    console.log(`- Cosmetics: ${networkAddresses.Cosmetics} (FIX THIS)`);
    console.log(`- Demons: ${currentDemons} (keep same)`);
    console.log(`- Cultists: ${currentCultists} (keep same)`);
    
    try {
        console.log(`\n🔄 Calling setContracts()...`);
        console.log(`This should work since we confirmed ownership.`);
        
        const tx = await maw.setContracts(
            networkAddresses.Relics,      // Keep same
            networkAddresses.Cosmetics,   // Fix this: 0xB0E32D... → 0x32640D...
            currentDemons,                // Keep same  
            currentCultists               // Keep same
        );
        
        console.log(`📝 Transaction hash: ${tx.hash}`);
        console.log(`⏳ Waiting for confirmation...`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed}`);
        
        // Verify the fix
        const newCosmetics = await maw.cosmetics();
        console.log(`\n🔍 Verification:`);
        console.log(`New cosmetics(): ${newCosmetics}`);
        console.log(`Expected: ${networkAddresses.Cosmetics}`);
        console.log(`Fixed: ${newCosmetics.toLowerCase() === networkAddresses.Cosmetics.toLowerCase() ? '✅ SUCCESS!' : '❌ Still wrong'}`);
        
        if (newCosmetics.toLowerCase() === networkAddresses.Cosmetics.toLowerCase()) {
            console.log(`\n🎉 PROXY WIRING FIXED!`);
            console.log(`Now both sides should work:`);
            console.log(`- Proxy Maw → correct Cosmetics ✅`);
            console.log(`- Cosmetics → Proxy Maw ✅ (already fixed earlier)`);
            console.log(`\nReady to test lantern fragment sacrifice!`);
        }
        
    } catch (error) {
        console.error(`❌ setContracts() failed: ${error.message}`);
        
        if (error.reason) {
            console.error(`Reason: ${error.reason}`);
        }
        
        if (error.data && error.data !== '0x') {
            console.error(`Error data: ${error.data}`);
            
            try {
                const decoded = maw.interface.parseError(error.data);
                console.error(`Decoded: ${decoded.name} - ${decoded.args}`);
            } catch (e) {
                console.error(`Could not decode error data`);
            }
        }
        
        console.log(`\nIf this still fails, there might be a deeper proxy issue.`);
        console.log(`Consider redeploying a fresh proxy with correct initialization.`);
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});