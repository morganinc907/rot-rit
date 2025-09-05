const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🧪 Final Cosmetic Sacrifice Test with NEW Maw");
    console.log("=============================================");
    
    const [signer] = await hre.ethers.getSigners();
    const networkName = hre.network.name;
    console.log(`Network: ${networkName}`);
    console.log(`User: ${signer.address}`);
    
    const NEW_MAW = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db"; // Fresh proxy
    const networkAddresses = addresses[networkName];
    
    console.log(`\n📋 Using NEW Maw Proxy: ${NEW_MAW}`);
    console.log(`Cosmetics: ${networkAddresses.Cosmetics}`);
    console.log(`Relics: ${networkAddresses.Relics}`);
    
    const newMaw = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", NEW_MAW);
    const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
    
    // Check balances with correct token IDs
    const LANTERN_FRAGMENT = 2;  // The ACTUAL lantern fragments
    const WORM_EATEN_MASK = 3;   // Worm-eaten masks
    const GLASS_SHARD = 6;       // Glass shards
    
    const fragmentBalance = await relics.balanceOf(signer.address, LANTERN_FRAGMENT);
    const maskBalance = await relics.balanceOf(signer.address, WORM_EATEN_MASK);
    const shardBalance = await relics.balanceOf(signer.address, GLASS_SHARD);
    
    console.log(`\n🔍 Current Balances:`);
    console.log(`- Lantern Fragments (ID ${LANTERN_FRAGMENT}): ${fragmentBalance}`);
    console.log(`- Worm-Eaten Masks (ID ${WORM_EATEN_MASK}): ${maskBalance}`);
    console.log(`- Glass Shards (ID ${GLASS_SHARD}): ${shardBalance}`);
    
    if (Number(fragmentBalance) < 1) {
        console.log(`❌ Need at least 1 Lantern Fragment to test`);
        return;
    }
    
    console.log(`\n🎯 Testing sacrificeForCosmetic() with NEW Maw:`);
    console.log(`- Fragments to sacrifice: 1`);
    console.log(`- Masks to use: 0`);
    console.log(`- Expected success rate: 35% (for 1 fragment)`);
    
    try {
        console.log(`\n🔄 Executing sacrificeForCosmetic(1, 0) on NEW Maw...`);
        const tx = await newMaw.sacrificeForCosmetic(1, 0);
        console.log(`Transaction hash: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed!`);
        console.log(`Gas used: ${receipt.gasUsed}`);
        
        // Check results
        const newFragmentBalance = await relics.balanceOf(signer.address, LANTERN_FRAGMENT);
        const fragmentsConsumed = Number(fragmentBalance) - Number(newFragmentBalance);
        
        console.log(`\n🔍 Results:`);
        console.log(`- Fragments consumed: ${fragmentsConsumed}`);
        console.log(`- Remaining fragments: ${newFragmentBalance}`);
        
        // Look for events
        let cosmeticReceived = false;
        let glassShardReceived = false;
        
        for (const log of receipt.logs) {
            try {
                const decoded = newMaw.interface.parseLog(log);
                if (decoded.name === "CosmeticRitualAttempted") {
                    cosmeticReceived = decoded.args.success;
                    if (cosmeticReceived) {
                        console.log(`🎉 SUCCESS! Received cosmetic type: ${decoded.args.cosmeticTypeId}`);
                    }
                }
            } catch (e) {
                // Try relics events for glass shard
                try {
                    const relicsDecoded = relics.interface.parseLog(log);
                    if (relicsDecoded.name === "TransferSingle" && 
                        relicsDecoded.args.id == GLASS_SHARD && 
                        relicsDecoded.args.from === "0x0000000000000000000000000000000000000000") {
                        glassShardReceived = true;
                        console.log(`🔹 Consolation prize: Received ${relicsDecoded.args.value} glass shard(s)`);
                    }
                } catch (e2) {
                    // Not a relevant event
                }
            }
        }
        
        if (!cosmeticReceived && !glassShardReceived) {
            console.log(`💔 No rewards received (unlucky roll)`);
        }
        
        console.log(`\n📊 Test Summary:`);
        console.log(`- Transaction executed successfully ✅`);
        console.log(`- Fragments properly consumed: ${fragmentsConsumed} ${fragmentsConsumed > 0 ? '✅' : '❌'}`);
        console.log(`- Used NEW Maw proxy ✅`);
        console.log(`- No "Only MawSacrifice" error ✅`);
        console.log(`- Result: ${cosmeticReceived ? 'Cosmetic received 🎨' : glassShardReceived ? 'Glass shard consolation 🔹' : 'No reward 💔'}`);
        
        if (fragmentsConsumed > 0) {
            console.log(`\n🎉 SUCCESS! The NEW Maw proxy system is working correctly!`);
            console.log(`✅ Fixed the "Only MawSacrifice" error`);
            console.log(`✅ Proper fragment consumption`);
            console.log(`✅ Correct sacrifice mechanics`);
        } else {
            console.log(`\n⚠️  Transaction succeeded but no fragments consumed - investigate further.`);
        }
        
    } catch (error) {
        console.error(`❌ Sacrifice failed: ${error.message}`);
        
        if (error.data) {
            try {
                const decodedError = newMaw.interface.parseError(error.data);
                console.error(`Decoded error: ${decodedError.name} - ${decodedError.args}`);
            } catch (decodeError) {
                console.error(`Raw error data: ${error.data}`);
            }
        }
        
        if (error.message.includes("Only MawSacrifice")) {
            console.log(`\n🔍 Still getting "Only MawSacrifice" - check Cosmetics wiring.`);
        }
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});