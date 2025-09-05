const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🧪 Testing 3 Lantern Fragment Sacrifice");
    console.log("=====================================");
    
    const [deployer] = await hre.ethers.getSigners();
    const networkName = hre.network.name;
    console.log(`Network: ${networkName}`);
    console.log(`User: ${deployer.address}`);
    
    const networkAddresses = addresses[networkName];
    if (!networkAddresses) {
        throw new Error(`No addresses found for network: ${networkName}`);
    }
    
    const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
    const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrificeV4NoTimelock);
    
    // Check initial state
    const initialFragments = await relics.balanceOf(deployer.address, 3); // Token ID 3 = Lantern Fragments
    console.log(`\n🔍 Initial lantern fragments: ${initialFragments}`);
    
    if (Number(initialFragments) < 3) {
        console.log("❌ Not enough lantern fragments for this test");
        return;
    }
    
    // Get available cosmetic types
    const cosmeticTypes = await mawSacrifice.getCurrentCosmeticTypes();
    console.log(`🎭 Available cosmetic types: [${cosmeticTypes.map(n => Number(n)).join(', ')}]`);
    
    console.log(`\n🎯 Sacrificing 3 lantern fragments (85% success rate with higher rewards)`);
    console.log(`- No worm-eaten masks for rarity boost`);
    
    try {
        console.log(`\n🔄 Executing sacrifice...`);
        const tx = await mawSacrifice.sacrificeKeys(3);
        console.log(`Transaction hash: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed`);
        console.log(`Gas used: ${receipt.gasUsed}`);
        
        // Check results
        const finalFragments = await relics.balanceOf(deployer.address, 3);
        const fragmentsUsed = Number(initialFragments) - Number(finalFragments);
        
        console.log(`\n🔍 Results:`);
        console.log(`- Fragments used: ${fragmentsUsed}`);
        console.log(`- Remaining fragments: ${finalFragments}`);
        
        // Look for cosmetic reward events
        const events = receipt.logs;
        let cosmeticReceived = false;
        
        for (const event of events) {
            try {
                const decoded = mawSacrifice.interface.parseLog(event);
                if (decoded.name === "CosmeticRewardGranted") {
                    cosmeticReceived = true;
                    console.log(`\n🎉 SUCCESS! Received cosmetic:`);
                    console.log(`- Cosmetic Type: ${decoded.args.cosmeticType}`);
                    console.log(`- Rarity: ${decoded.args.rarity}`);
                }
            } catch (e) {
                // Not a MawSacrifice event, skip
            }
        }
        
        if (!cosmeticReceived) {
            console.log(`\n💔 No cosmetic reward received (unlucky roll)`);
        }
        
        console.log(`\n📊 Test Summary:`);
        console.log(`- Transaction executed successfully ✅`);
        console.log(`- Fragments properly consumed: ${fragmentsUsed} ✅`);
        console.log(`- Result: ${cosmeticReceived ? 'Cosmetic received 🎨' : 'No reward 💔'}`);
        
    } catch (error) {
        console.error("❌ Sacrifice failed:", error.message);
        
        // Try to decode the error
        if (error.data) {
            try {
                const decodedError = mawSacrifice.interface.parseError(error.data);
                console.error("Decoded error:", decodedError);
            } catch (decodeError) {
                console.error("Raw error data:", error.data);
            }
        }
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});