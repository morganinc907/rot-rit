const hre = require("hardhat");

const COSMETICS_ADDRESS = "0x0de59ef75ddf2d7c6310f5f8c84bb52e6e0873b3";

async function main() {
  console.log("Testing cosmetics contract calls...");
  
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);

  try {
    // Test if raccoon 1 has any equipped cosmetics
    console.log("Calling getEquippedCosmetics for raccoon #1...");
    const equipped = await cosmetics.getEquippedCosmetics(1);
    console.log("Equipped cosmetics:", equipped);
  } catch (error) {
    console.error("Error calling getEquippedCosmetics:", error.message);
    
    // Try checking if the raccoon is valid
    try {
      const isValid = await cosmetics.isValidRaccoon(1);
      console.log("Is raccoon 1 valid:", isValid);
    } catch (err) {
      console.error("Error checking raccoon validity:", err.message);
    }
  }
}

main().catch(console.error);