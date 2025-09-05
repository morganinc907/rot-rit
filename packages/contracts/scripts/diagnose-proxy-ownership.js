const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔍 UUPS Proxy Ownership & Initialization Diagnosis");
    console.log("==================================================");
    
    const [signer] = await hre.ethers.getSigners();
    const networkName = hre.network.name;
    const networkAddresses = addresses[networkName];
    
    const proxyAddress = networkAddresses.MawSacrificeV4NoTimelock; // 0xE9F133387d1bA847Cf25c391f01D5CFE6D151083
    
    console.log(`Signer: ${signer.address}`);
    console.log(`Proxy address: ${proxyAddress}`);
    console.log(`Network: ${networkName} (should be baseSepolia)`);
    
    const maw = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", proxyAddress);
    
    console.log(`\n🔍 Proxy Ownership Check:`);
    try {
        const owner = await maw.owner();
        console.log(`- Proxy owner: ${owner}`);
        console.log(`- Is zero address: ${owner === "0x0000000000000000000000000000000000000000" ? '❌ UNINITIALIZED' : '✅'}`);
        console.log(`- Signer is owner: ${owner.toLowerCase() === signer.address.toLowerCase() ? '✅' : '❌'}`);
        
        if (owner === "0x0000000000000000000000000000000000000000") {
            console.log(`\n🚨 DIAGNOSIS: Proxy was never initialized!`);
            console.log(`This explains why setContracts() reverts - onlyOwner fails when owner is zero.`);
            return { needsInitialization: true };
        } else if (owner.toLowerCase() !== signer.address.toLowerCase()) {
            console.log(`\n🚨 DIAGNOSIS: Signer is not the proxy owner!`);
            console.log(`You need to use account ${owner} to call setContracts().`);
            return { wrongOwner: true, correctOwner: owner };
        }
    } catch (error) {
        console.log(`❌ Error checking owner: ${error.message}`);
        console.log(`This might indicate the proxy isn't properly initialized.`);
        return { error: true };
    }
    
    console.log(`\n📋 Current Proxy Wiring:`);
    try {
        const cosmetics = await maw.cosmetics();
        const relics = await maw.relics();
        const demons = await maw.demons();
        const cultists = await maw.cultists();
        
        console.log(`- cosmetics(): ${cosmetics}`);
        console.log(`  Expected: ${networkAddresses.Cosmetics}`);
        console.log(`  Correct: ${cosmetics.toLowerCase() === networkAddresses.Cosmetics.toLowerCase() ? '✅' : '❌ WRONG'}`);
        
        console.log(`- relics(): ${relics}`);
        console.log(`  Expected: ${networkAddresses.Relics}`);
        console.log(`  Correct: ${relics.toLowerCase() === networkAddresses.Relics.toLowerCase() ? '✅' : '❌'}`);
        
        console.log(`- demons(): ${demons}`);
        console.log(`- cultists(): ${cultists}`);
        
        if (cosmetics.toLowerCase() !== networkAddresses.Cosmetics.toLowerCase()) {
            console.log(`\n🎯 ISSUE CONFIRMED: Proxy points to old Cosmetics!`);
            console.log(`Need to call setContracts() to fix this.`);
        }
        
    } catch (error) {
        console.log(`❌ Error reading proxy state: ${error.message}`);
    }
    
    return { initialized: true, canFix: true };
}

main().then(async (result) => {
    if (result.needsInitialization) {
        console.log(`\n🔧 Next Step: Initialize the proxy`);
        console.log(`Call: maw.initialize(relics, cosmetics, demons, cultists)`);
    } else if (result.wrongOwner) {
        console.log(`\n🔧 Next Step: Use the correct owner account`);
        console.log(`Switch to: ${result.correctOwner}`);
    } else if (result.canFix) {
        console.log(`\n🔧 Next Step: Call setContracts() to fix wiring`);
        console.log(`This should work since you are the owner.`);
    }
}).catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});