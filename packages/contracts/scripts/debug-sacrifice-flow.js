const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔍 Debugging sacrifice flow");
    console.log("User address:", deployer.address);

    // Contract addresses
    const mawSacrificeAddress = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
    const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const cosmeticsAddress = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
    
    // Get contract instances
    const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", mawSacrificeAddress);
    const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    console.log(`\n📋 Contract Addresses:`);
    console.log(`- MawSacrifice: ${mawSacrificeAddress}`);
    console.log(`- Relics: ${relicsAddress}`);
    console.log(`- Cosmetics: ${cosmeticsAddress}`);
    
    // Check what Relics contract MawSacrifice thinks it should use
    try {
        const mawRelicsAddress = await mawSacrifice.relics();
        console.log(`\n🎯 MawSacrifice's relics address: ${mawRelicsAddress}`);
        console.log(`✅ Match status: ${mawRelicsAddress.toLowerCase() === relicsAddress.toLowerCase() ? 'MATCH' : 'MISMATCH'}`);
        
        if (mawRelicsAddress.toLowerCase() !== relicsAddress.toLowerCase()) {
            console.log(`❌ PROBLEM: MawSacrifice is pointing to wrong Relics contract!`);
            console.log(`Expected: ${relicsAddress}`);
            console.log(`Actual: ${mawRelicsAddress}`);
        }
    } catch (error) {
        console.log(`❌ Error getting relics address from MawSacrifice: ${error.message}`);
    }
    
    // Check Relics authorization
    try {
        const currentMaw = await relics.mawSacrifice();
        console.log(`\n🔥 Relics' mawSacrifice address: ${currentMaw}`);
        console.log(`✅ Match status: ${currentMaw.toLowerCase() === mawSacrificeAddress.toLowerCase() ? 'MATCH' : 'MISMATCH'}`);
    } catch (error) {
        console.log(`❌ Error checking Relics mawSacrifice: ${error.message}`);
    }
    
    // Check user balances
    console.log(`\n💰 User Balances:`);
    try {
        const lanternBalance = await relics.balanceOf(deployer.address, 1); // Lantern Fragment
        const maskBalance = await relics.balanceOf(deployer.address, 2);    // Worm-Eaten Mask
        const glassBalance = await relics.balanceOf(deployer.address, 3);   // Glass Shard
        console.log(`- Lantern Fragments (ID 1): ${lanternBalance}`);
        console.log(`- Worm-Eaten Masks (ID 2): ${maskBalance}`);
        console.log(`- Glass Shards (ID 3): ${glassBalance}`);
    } catch (error) {
        console.log(`❌ Error checking balances: ${error.message}`);
    }
    
    // Try to simulate the burn directly
    console.log(`\n🔥 Testing direct burn authorization:`);
    try {
        // Try to call the burn function directly from MawSacrifice
        const burnCalldata = relics.interface.encodeFunctionData("burn", [deployer.address, 1, 1]);
        const success = await deployer.call({
            to: relicsAddress,
            data: burnCalldata,
            from: mawSacrificeAddress
        });
        console.log(`✅ Burn simulation success: ${success}`);
    } catch (error) {
        console.log(`❌ Burn simulation failed: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });