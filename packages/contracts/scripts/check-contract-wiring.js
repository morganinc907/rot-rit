const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔍 Checking Contract Address Wiring");
    console.log("===================================");
    
    const networkName = hre.network.name;
    const networkAddresses = addresses[networkName];
    
    const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
    const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrificeV4NoTimelock);
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", networkAddresses.Cosmetics);
    
    console.log(`\n📋 Expected Addresses:`);
    console.log(`- Relics: ${networkAddresses.Relics}`);
    console.log(`- MawSacrifice: ${networkAddresses.MawSacrificeV4NoTimelock}`);
    console.log(`- Cosmetics: ${networkAddresses.Cosmetics}`);
    
    console.log(`\n🔗 Address Wiring Check:`);
    
    // 1) What Cosmetics address is Maw using?
    try {
        const mawCosmeticsAddr = await mawSacrifice.cosmetics();
        console.log(`1. Maw → cosmetics(): ${mawCosmeticsAddr}`);
        console.log(`   Expected: ${networkAddresses.Cosmetics}`);
        console.log(`   Match: ${mawCosmeticsAddr.toLowerCase() === networkAddresses.Cosmetics.toLowerCase() ? '✅' : '❌'}`);
    } catch (e) {
        console.log(`1. Maw → cosmetics(): ❌ Error: ${e.message}`);
    }
    
    // 2) What Maw address is Cosmetics expecting?
    try {
        const cosmeticsMawAddr = await cosmetics.mawSacrifice();
        console.log(`\n2. Cosmetics → mawSacrifice(): ${cosmeticsMawAddr}`);
        console.log(`   Expected: ${networkAddresses.MawSacrificeV4NoTimelock}`);
        console.log(`   Match: ${cosmeticsMawAddr.toLowerCase() === networkAddresses.MawSacrificeV4NoTimelock.toLowerCase() ? '✅' : '❌'}`);
        
        if (cosmeticsMawAddr.toLowerCase() !== networkAddresses.MawSacrificeV4NoTimelock.toLowerCase()) {
            console.log(`   🚨 SMOKING GUN: Cosmetics points to wrong Maw address!`);
        }
    } catch (e) {
        console.log(`\n2. Cosmetics → mawSacrifice(): ❌ Error: ${e.message}`);
    }
    
    // 3) What Relics address is Maw using?
    try {
        const mawRelicsAddr = await mawSacrifice.relics();
        console.log(`\n3. Maw → relics(): ${mawRelicsAddr}`);
        console.log(`   Expected: ${networkAddresses.Relics}`);
        console.log(`   Match: ${mawRelicsAddr.toLowerCase() === networkAddresses.Relics.toLowerCase() ? '✅' : '❌'}`);
    } catch (e) {
        console.log(`\n3. Maw → relics(): ❌ Error: ${e.message}`);
    }
    
    console.log(`\n🔧 Diagnosis:`);
    console.log(`If (2) shows a mismatch, that's the root cause of "Only MawSacrifice" error.`);
    console.log(`The Cosmetics contract doesn't recognize the current Maw as authorized.`);
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});