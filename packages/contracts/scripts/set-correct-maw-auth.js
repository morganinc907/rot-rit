const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔧 Setting Correct MawSacrifice Authorization");
    console.log("=============================================");
    
    const [deployer] = await hre.ethers.getSigners();
    const networkName = hre.network.name;
    console.log(`Network: ${networkName}`);
    console.log(`Deployer: ${deployer.address}`);
    
    const networkAddresses = addresses[networkName];
    if (!networkAddresses) {
        throw new Error(`No addresses found for network: ${networkName}`);
    }
    
    console.log(`\n📋 Contract Addresses:`);
    console.log(`- Relics: ${networkAddresses.Relics}`);
    console.log(`- Correct MawSacrificeV4NoTimelock: ${networkAddresses.MawSacrificeV4NoTimelock}`);
    console.log(`- Old MawSacrifice: ${networkAddresses.MawSacrifice}`);
    
    const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
    
    console.log(`\n🔧 Setting mawSacrifice address to correct contract...`);
    const tx = await relics.setMawSacrifice(networkAddresses.MawSacrificeV4NoTimelock);
    console.log(`📝 Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed}`);
    
    // Verify
    const newMawAddress = await relics.mawSacrifice();
    console.log(`\n🎯 New mawSacrifice address: ${newMawAddress}`);
    console.log(`✅ Status: ${newMawAddress === networkAddresses.MawSacrificeV4NoTimelock ? 'SUCCESS' : 'FAILED'}`);
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});