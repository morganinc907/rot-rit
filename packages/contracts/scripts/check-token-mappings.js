const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔍 Debugging Contract State and Token IDs");
    console.log("=========================================");
    
    const [deployer] = await hre.ethers.getSigners();
    const networkName = hre.network.name;
    const networkAddresses = addresses[networkName];
    
    const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
    const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrificeV4NoTimelock);
    
    console.log(`\n📋 Contract Addresses:`);
    console.log(`- Relics: ${networkAddresses.Relics}`);
    console.log(`- MawSacrifice: ${networkAddresses.MawSacrificeV4NoTimelock}`);
    
    console.log(`\n📊 Current Token Balances:`);
    for (let i = 0; i < 10; i++) {
        try {
            const balance = await relics.balanceOf(deployer.address, i);
            if (balance > 0) {
                console.log(`Token ID ${i}: ${balance}`);
            }
        } catch (e) {
            // Skip if error
        }
    }
    
    console.log(`\n❌ ISSUE IDENTIFIED:`);
    console.log(`The sacrificeKeys() function is sacrificing KEYS (token ID 1)`);
    console.log(`instead of LANTERN_FRAGMENTS (token ID 3) as expected.`);
    console.log(`\nThis suggests either:`);
    console.log(`1. The function name is misleading (it really does sacrifice keys)`);
    console.log(`2. There's a bug in the contract implementation`);
    console.log(`3. We need a different function to sacrifice lantern fragments`);
    
    // Let's check what functions are available
    console.log(`\n🔧 Available Functions in MawSacrifice:`);
    const interface = mawSacrifice.interface;
    const functions = Object.keys(interface.functions);
    const sacrificeFunctions = functions.filter(f => f.toLowerCase().includes('sacrifice'));
    console.log(`Sacrifice-related functions:`, sacrificeFunctions);
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});