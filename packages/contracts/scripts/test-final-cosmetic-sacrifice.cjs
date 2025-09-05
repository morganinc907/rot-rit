const hre = require("hardhat");

async function main() {
    console.log("🧪 Testing Fully Configurable Cosmetic Sacrifice...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Testing with account:", deployer.address);
    
    const PROXY = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
    const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const COSMETICS = "0xFC6768b2A3cf725FF0703ca82C7e75B2a5A6f7a7";
    
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", PROXY);
    const relics = await hre.ethers.getContractAt("IERC1155", RELICS);
    const cosmetics = await hre.ethers.getContractAt("IERC1155", COSMETICS);
    
    // Check configuration
    const config = await maw.getCosmeticSacrificeConfig();
    console.log("Current configuration:");
    console.log("  Primary Token ID:", config[0].toString(), "(fragments)");
    console.log("  Primary Min/Max:", config[1].toString(), "/", config[2].toString());
    console.log("  Bonus Token ID:", config[3].toString(), "(masks)");
    console.log("  Bonus Enabled:", config[4]);
    console.log("  Bonus Max:", config[5].toString());
    
    // Check user balances
    const fragBalance = await relics.balanceOf(deployer.address, 2);
    const maskBalance = await relics.balanceOf(deployer.address, 3);
    console.log("\nUser balances:");
    console.log("  Fragments (ID 2):", fragBalance.toString());
    console.log("  Masks (ID 3):", maskBalance.toString());
    
    // Check cosmetic pool
    try {
        const [cosmeticIds, weights, totalWeight] = await maw.getCosmeticPool();
        console.log("\nCosmetic Pool:");
        console.log("  Token IDs:", cosmeticIds.map(id => id.toString()));
        console.log("  Weights:", weights.map(w => w.toString()));
        console.log("  Total Weight:", totalWeight.toString());
    } catch (error) {
        console.log("❌ Error getting cosmetic pool:", error.message);
    }
    
    if (fragBalance >= 1n) {
        console.log("\n🎯 Testing sacrifice transaction...");
        
        // Check approval
        const isApproved = await relics.isApprovedForAll(deployer.address, PROXY);
        console.log("MAW approved for Relics:", isApproved);
        
        if (!isApproved) {
            console.log("Setting approval for MAW...");
            const approveTx = await relics.setApprovalForAll(PROXY, true);
            await approveTx.wait();
            console.log("✅ Approval set");
        }
        
        try {
            // Test sacrifice with 1 fragment, 0 masks
            console.log("Attempting sacrifice: 1 fragment, 0 masks");
            const sacrificeTx = await maw.sacrificeForCosmetic(1, 0);
            const receipt = await sacrificeTx.wait();
            
            console.log("✅ Sacrifice successful!");
            console.log("Transaction hash:", receipt.hash);
            
            // Check events
            for (const log of receipt.logs) {
                try {
                    const parsed = maw.interface.parseLog(log);
                    if (parsed) {
                        console.log("Event:", parsed.name, parsed.args);
                    }
                } catch (e) {
                    // Try other contract interfaces
                    try {
                        const parsedRelics = relics.interface.parseLog(log);
                        if (parsedRelics) {
                            console.log("Relics Event:", parsedRelics.name, parsedRelics.args);
                        }
                    } catch (e2) {
                        try {
                            const parsedCosmetics = cosmetics.interface.parseLog(log);
                            if (parsedCosmetics) {
                                console.log("Cosmetics Event:", parsedCosmetics.name, parsedCosmetics.args);
                            }
                        } catch (e3) {
                            // Ignore unparseable logs
                        }
                    }
                }
            }
            
        } catch (error) {
            console.log("❌ Sacrifice failed:", error.message);
        }
    } else {
        console.log("⚠️ User doesn't have enough fragments to test sacrifice");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });