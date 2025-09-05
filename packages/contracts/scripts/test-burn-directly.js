const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🧪 Testing Direct Burn Capability");
    console.log("=================================");
    
    const [deployer] = await hre.ethers.getSigners();
    const networkName = hre.network.name;
    const networkAddresses = addresses[networkName];
    
    const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
    
    console.log(`User: ${deployer.address}`);
    console.log(`Relics: ${networkAddresses.Relics}`);
    console.log(`MawSacrifice: ${networkAddresses.MawSacrificeV4NoTimelock}`);
    
    // Check current mawSacrifice setting
    const currentMawSacrifice = await relics.mawSacrifice();
    console.log(`\nCurrent mawSacrifice in Relics: ${currentMawSacrifice}`);
    console.log(`Expected MawSacrifice: ${networkAddresses.MawSacrificeV4NoTimelock}`);
    console.log(`Match: ${currentMawSacrifice === networkAddresses.MawSacrificeV4NoTimelock ? '✅' : '❌'}`);
    
    // Check fragment balance
    const LANTERN_FRAGMENT = 2;
    const fragmentBalance = await relics.balanceOf(deployer.address, LANTERN_FRAGMENT);
    console.log(`\nLantern Fragments balance: ${fragmentBalance}`);
    
    if (currentMawSacrifice !== networkAddresses.MawSacrificeV4NoTimelock) {
        console.log("\n❌ MawSacrifice address mismatch detected!");
        console.log("This explains the 'Only MawSacrifice' error.");
        console.log("The Relics contract is checking against a different address.");
    } else {
        console.log("\n✅ MawSacrifice address is correct!");
        console.log("The authorization should work for burn operations.");
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});