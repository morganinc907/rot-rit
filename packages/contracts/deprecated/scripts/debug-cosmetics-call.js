const hre = require("hardhat");

const RACCOONS_ADDRESS = "0x84d329C3a42Ad20Eb3335f6c86384ECd550c0aBa";

async function main() {
  console.log("Testing cosmetics integration...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  try {
    // Check cosmetics address
    const cosmeticsAddress = await raccoons.cosmetics();
    console.log("Cosmetics address:", cosmeticsAddress);
    
    // Check dynamic metadata URI
    const dynamicURI = await raccoons.dynamicMetadataURI();
    console.log("Dynamic metadata URI:", dynamicURI);
    
    // Test hasCosmetics function
    try {
      const hasCosmetics = await raccoons.hasCosmetics(1);
      console.log("Token 1 has cosmetics:", hasCosmetics);
    } catch (err) {
      console.error("hasCosmetics error:", err.message);
    }
    
    // Test the cosmetics contract directly
    if (cosmeticsAddress && cosmeticsAddress !== "0x0000000000000000000000000000000000000000") {
      console.log("Testing cosmetics contract directly...");
      try {
        const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
        const equipped = await cosmetics.getEquippedCosmetics(1);
        console.log("Equipped cosmetics for token 1:", equipped);
      } catch (err) {
        console.error("Direct cosmetics call error:", err.message);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);