const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔍 Quick Debug Check");
    console.log("===================");
    
    const [signer] = await hre.ethers.getSigners();
    const networkAddresses = addresses[hre.network.name];
    
    const newMaw = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrificeV4NoTimelock);
    const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
    
    // Check token ID constants
    const LANTERN_FRAGMENT = await newMaw.LANTERN_FRAGMENT();
    console.log(`Contract says LANTERN_FRAGMENT = ${LANTERN_FRAGMENT}`);
    
    // Check user balance of that token
    const balance = await relics.balanceOf(signer.address, LANTERN_FRAGMENT);
    console.log(`User balance of token ${LANTERN_FRAGMENT}: ${balance}`);
    
    // Check MAW_ROLE  
    const MAW_ROLE = hre.ethers.id("MAW_ROLE");
    const hasRole = await relics.hasRole(MAW_ROLE, networkAddresses.MawSacrificeV4NoTimelock);
    console.log(`New Maw has MAW_ROLE: ${hasRole}`);
    
    // Check all token balances for reference
    console.log(`\nAll token balances:`);
    for (let i = 0; i <= 10; i++) {
        const bal = await relics.balanceOf(signer.address, i);
        if (bal > 0) console.log(`Token ${i}: ${bal}`);
    }
}

main().catch(console.error);