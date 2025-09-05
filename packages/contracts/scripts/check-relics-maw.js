const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    const networkAddresses = addresses[hre.network.name];
    const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
    
    const currentMaw = await relics.mawSacrifice();
    const expectedMaw = networkAddresses.MawSacrificeV4NoTimelock;
    
    console.log("Relics mawSacrifice():", currentMaw);
    console.log("Expected:", expectedMaw);
    console.log("Match:", currentMaw.toLowerCase() === expectedMaw.toLowerCase());
}

main().catch(console.error);