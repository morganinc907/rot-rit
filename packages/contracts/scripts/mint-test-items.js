const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🧪 Minting test items for cosmetic sacrifice");
    console.log("User address:", deployer.address);

    const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
    
    // Check current balances
    const lanternBalance = await relics.balanceOf(deployer.address, 2);
    const maskBalance = await relics.balanceOf(deployer.address, 3);
    
    console.log(`\n💰 Current Balances:`);
    console.log(`- Lantern Fragments (ID 2): ${lanternBalance}`);
    console.log(`- Worm-Eaten Masks (ID 3): ${maskBalance}`);
    
    // Mint Lantern Fragments (ID 2)
    if (lanternBalance < 5) {
        console.log("\n🔥 Minting 10 Lantern Fragments...");
        try {
            const tx1 = await relics.mint(deployer.address, 2, 10, "0x");
            console.log(`📝 Lantern tx: ${tx1.hash}`);
            await tx1.wait();
            console.log("✅ Lantern Fragments minted");
        } catch (error) {
            console.log(`❌ Error minting fragments: ${error.message}`);
        }
    }
    
    // Mint Worm-Eaten Masks (ID 3)  
    if (maskBalance < 5) {
        console.log("\n🐛 Minting 10 Worm-Eaten Masks...");
        try {
            const tx2 = await relics.mint(deployer.address, 3, 10, "0x");
            console.log(`📝 Mask tx: ${tx2.hash}`);
            await tx2.wait();
            console.log("✅ Worm-Eaten Masks minted");
        } catch (error) {
            console.log(`❌ Error minting masks: ${error.message}`);
        }
    }
    
    // Check final balances
    const finalLantern = await relics.balanceOf(deployer.address, 2);
    const finalMask = await relics.balanceOf(deployer.address, 3);
    
    console.log(`\n🎯 Final Balances:`);
    console.log(`- Lantern Fragments (ID 2): ${finalLantern}`);
    console.log(`- Worm-Eaten Masks (ID 3): ${finalMask}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });