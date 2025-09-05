const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔍 Checking MawSacrifice Initialization Status");
    console.log("==============================================");
    
    const networkName = hre.network.name;
    const networkAddresses = addresses[networkName];
    
    const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrificeV4NoTimelock);
    
    console.log(`Contract: ${networkAddresses.MawSacrificeV4NoTimelock}`);
    
    try {
        // Check if basic initialized state is accessible
        const owner = await mawSacrifice.owner();
        console.log(`\n✅ Contract is initialized - owner: ${owner}`);
        
        // Check contract addresses
        console.log(`\n📋 Current contract pointers:`);
        try {
            const relics = await mawSacrifice.relics();
            console.log(`- relics: ${relics}`);
        } catch (e) {
            console.log(`- relics: ❌ Error: ${e.message}`);
        }
        
        try {
            const cosmetics = await mawSacrifice.cosmetics();
            console.log(`- cosmetics: ${cosmetics}`);
        } catch (e) {
            console.log(`- cosmetics: ❌ Error: ${e.message}`);
        }
        
        try {
            const demons = await mawSacrifice.demons();
            console.log(`- demons: ${demons}`);
        } catch (e) {
            console.log(`- demons: ❌ Error: ${e.message}`);
        }
        
        try {
            const cultists = await mawSacrifice.cultists();
            console.log(`- cultists: ${cultists}`);
        } catch (e) {
            console.log(`- cultists: ❌ Error: ${e.message}`);
        }
        
        // Check if setContracts would work with current values (maintain same addresses)
        console.log(`\n🧪 Testing if setContracts works with same addresses...`);
        try {
            await mawSacrifice.setContracts.staticCall(
                await mawSacrifice.relics(),
                await mawSacrifice.cosmetics(), 
                await mawSacrifice.demons(),
                await mawSacrifice.cultists()
            );
            console.log(`✅ setContracts static call succeeded with same addresses`);
            console.log(`The function itself works - issue might be with new addresses`);
        } catch (e) {
            console.log(`❌ setContracts static call failed even with same addresses: ${e.message}`);
            console.log(`This suggests a deeper issue with the contract state`);
        }
        
        // Try with just updating cosmetics
        console.log(`\n🎯 Testing with updated cosmetics address only...`);
        try {
            await mawSacrifice.setContracts.staticCall(
                await mawSacrifice.relics(),
                networkAddresses.Cosmetics,  // Only change this
                await mawSacrifice.demons(),
                await mawSacrifice.cultists()
            );
            console.log(`✅ setContracts would work with new cosmetics address`);
        } catch (e) {
            console.log(`❌ setContracts fails with new cosmetics: ${e.message}`);
            if (e.data && e.data !== '0x') {
                console.log(`Error data: ${e.data}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Contract appears uninitialized or broken: ${error.message}`);
        console.log(`\nThis could mean:`);
        console.log(`1. Contract was deployed but never initialized`);
        console.log(`2. Contract proxy is pointing to wrong implementation`);
        console.log(`3. Storage corruption from upgrades`);
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});