const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔍 Debugging Transaction Events");
    console.log("==============================");
    
    const txHash = "0x5dd8c0e720ecb1fbef57a58dc134db486fe76add6f517d14568b683e759fd741";
    
    try {
        const provider = hre.ethers.provider;
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);
        
        console.log(`\n📋 Transaction Details:`);
        console.log(`Hash: ${tx.hash}`);
        console.log(`From: ${tx.from}`);
        console.log(`To: ${tx.to}`);
        console.log(`Status: ${receipt.status} (${receipt.status === 1 ? 'SUCCESS' : 'FAILED'})`);
        console.log(`Gas Used: ${receipt.gasUsed}`);
        console.log(`Logs Count: ${receipt.logs.length}`);
        
        const networkName = hre.network.name;
        const networkAddresses = addresses[networkName];
        const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrificeV4NoTimelock);
        const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
        
        console.log(`\n📝 Analyzing Events:`);
        let fragmentBurns = 0;
        let cosmeticRewards = 0;
        
        for (let i = 0; i < receipt.logs.length; i++) {
            const log = receipt.logs[i];
            console.log(`\nEvent ${i + 1}:`);
            console.log(`  Address: ${log.address}`);
            
            // Try to decode with MawSacrifice interface
            try {
                if (log.address.toLowerCase() === networkAddresses.MawSacrificeV4NoTimelock.toLowerCase()) {
                    const decoded = mawSacrifice.interface.parseLog(log);
                    console.log(`  🎯 MawSacrifice Event: ${decoded.name}`);
                    if (decoded.name === "CosmeticRewardGranted") {
                        cosmeticRewards++;
                        console.log(`    User: ${decoded.args.user}`);
                        console.log(`    Cosmetic Type: ${decoded.args.cosmeticType}`);
                        console.log(`    Rarity: ${decoded.args.rarity}`);
                    }
                    console.log(`    Args:`, decoded.args);
                }
            } catch (e) {
                // Not a MawSacrifice event or failed to decode
            }
            
            // Try to decode with Relics interface
            try {
                if (log.address.toLowerCase() === networkAddresses.Relics.toLowerCase()) {
                    const decoded = relics.interface.parseLog(log);
                    console.log(`  🏺 Relics Event: ${decoded.name}`);
                    if (decoded.name === "TransferBatch" || decoded.name === "TransferSingle") {
                        console.log(`    From: ${decoded.args.from}`);
                        console.log(`    To: ${decoded.args.to}`);
                        if (decoded.name === "TransferSingle") {
                            console.log(`    Token ID: ${decoded.args.id}`);
                            console.log(`    Amount: ${decoded.args.value}`);
                            if (decoded.args.id == 3 && decoded.args.from !== "0x0000000000000000000000000000000000000000") {
                                fragmentBurns += Number(decoded.args.value);
                            }
                        } else {
                            console.log(`    Token IDs: ${decoded.args.ids}`);
                            console.log(`    Amounts: ${decoded.args.values}`);
                            for (let j = 0; j < decoded.args.ids.length; j++) {
                                if (decoded.args.ids[j] == 3 && decoded.args.from !== "0x0000000000000000000000000000000000000000") {
                                    fragmentBurns += Number(decoded.args.values[j]);
                                }
                            }
                        }
                    }
                    console.log(`    Args:`, decoded.args);
                }
            } catch (e) {
                // Not a Relics event or failed to decode
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`- Fragments burned: ${fragmentBurns}`);
        console.log(`- Cosmetic rewards: ${cosmeticRewards}`);
        console.log(`- Transaction succeeded but consumed 0 fragments: ${fragmentBurns === 0 ? '❌ BUG DETECTED' : '✅ Working correctly'}`);
        
        // Decode the function call
        console.log(`\n🔧 Function Call Analysis:`);
        try {
            const decoded = mawSacrifice.interface.parseTransaction({ data: tx.data });
            console.log(`Function: ${decoded.name}`);
            console.log(`Args:`, decoded.args);
            console.log(`Requested fragments to sacrifice: ${decoded.args[0]}`);
        } catch (e) {
            console.log(`Failed to decode function call: ${e.message}`);
        }
        
    } catch (error) {
        console.error("❌ Failed to analyze transaction:", error.message);
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});