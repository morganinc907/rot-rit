const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔍 Checking MawSacrifice authorization");
    console.log("Deployer address:", deployer.address);

    // Contract addresses
    const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const mawSacrificeAddress = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
    
    // Get contract instances
    const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
    
    console.log(`\n📋 Contract Addresses:`);
    console.log(`- Relics: ${relicsAddress}`);
    console.log(`- MawSacrifice: ${mawSacrificeAddress}`);
    
    // Check current mawSacrifice address
    try {
        const currentMaw = await relics.mawSacrifice();
        console.log(`\n🎯 Current mawSacrifice address: ${currentMaw}`);
        console.log(`✅ Match status: ${currentMaw.toLowerCase() === mawSacrificeAddress.toLowerCase() ? 'MATCH' : 'MISMATCH'}`);
    } catch (error) {
        console.log(`❌ Error getting mawSacrifice address: ${error.message}`);
    }
    
    // Check if MawSacrifice has burn role
    const MAW_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("MAW_ROLE"));
    try {
        const hasMawRole = await relics.hasRole(MAW_ROLE, mawSacrificeAddress);
        console.log(`\n🔥 MAW_ROLE status: ${hasMawRole ? 'HAS ROLE' : 'NO ROLE'}`);
    } catch (error) {
        console.log(`❌ Error checking MAW_ROLE: ${error.message}`);
    }
    
    // Check owner
    try {
        const owner = await relics.owner();
        console.log(`\n👑 Relics owner: ${owner}`);
        console.log(`✅ Is deployer owner: ${owner.toLowerCase() === deployer.address.toLowerCase() ? 'YES' : 'NO'}`);
    } catch (error) {
        console.log(`❌ Error checking owner: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });