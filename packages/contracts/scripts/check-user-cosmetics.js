const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🎨 Checking User Cosmetics Inventory");
    console.log("====================================");
    
    const [signer] = await hre.ethers.getSigners();
    const networkAddresses = addresses[hre.network.name];
    
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", networkAddresses.Cosmetics);
    
    console.log(`User: ${signer.address}`);
    console.log(`Cosmetics Contract: ${networkAddresses.Cosmetics}`);
    
    console.log(`\n🔍 Scanning for cosmetics (checking IDs 1-20)...`);
    
    let totalCosmetics = 0;
    const ownedCosmetics = [];
    
    for (let i = 1; i <= 20; i++) {
        try {
            const balance = await cosmetics.balanceOf(signer.address, i);
            if (balance > 0) {
                totalCosmetics += Number(balance);
                
                // Get cosmetic info
                try {
                    const info = await cosmetics.getCosmeticInfo(i);
                    ownedCosmetics.push({
                        id: i,
                        balance: Number(balance),
                        name: info.name || `Cosmetic ${i}`,
                        slot: Number(info.slot) || 0,
                        rarity: Number(info.rarity) || 0,
                        description: info.description || 'No description'
                    });
                    
                    console.log(`✅ Cosmetic ID ${i}: ${Number(balance)}x "${info.name}" (Slot: ${info.slot}, Rarity: ${info.rarity})`);
                } catch (infoError) {
                    // If getCosmeticInfo fails, still show the balance
                    ownedCosmetics.push({
                        id: i,
                        balance: Number(balance),
                        name: `Unknown Cosmetic ${i}`,
                        slot: 0,
                        rarity: 0,
                        description: 'Info unavailable'
                    });
                    console.log(`✅ Cosmetic ID ${i}: ${Number(balance)}x (info unavailable)`);
                }
            }
        } catch (e) {
            // Skip errors for non-existent cosmetics
        }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`Total cosmetics owned: ${totalCosmetics}`);
    console.log(`Unique cosmetic types: ${ownedCosmetics.length}`);
    
    if (ownedCosmetics.length === 0) {
        console.log(`\n💔 No cosmetics found in wallet`);
        console.log(`Try sacrificing more lantern fragments to earn cosmetics!`);
    } else {
        console.log(`\n🎉 Your Cosmetic Collection:`);
        ownedCosmetics.forEach(cosmetic => {
            const rarityNames = ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
            const rarityName = rarityNames[cosmetic.rarity] || `Rarity ${cosmetic.rarity}`;
            console.log(`  ${cosmetic.balance}x ${cosmetic.name} (${rarityName})`);
        });
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});