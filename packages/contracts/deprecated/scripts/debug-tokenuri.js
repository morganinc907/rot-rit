const hre = require("hardhat");

const RACCOONS_ADDRESS = "0x84d329C3a42Ad20Eb3335f6c86384ECd550c0aBa";

async function main() {
  console.log("Testing tokenURI function...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  try {
    console.log("Checking contract state...");
    
    // Check if token exists
    const exists = await raccoons.exists(1);
    console.log("Token 1 exists:", exists);
    
    if (exists) {
      // Check if revealed
      const revealed = await raccoons.revealed();
      console.log("Contract revealed:", revealed);
      
      // Check base URI
      try {
        const baseURI = await raccoons.baseTokenURI();
        console.log("Base token URI:", baseURI);
      } catch (err) {
        console.log("Error getting base URI:", err.message);
      }
      
      // Check prereveal URI
      try {
        const preReveal = await raccoons.preRevealURI();
        console.log("Pre-reveal URI:", preReveal);
      } catch (err) {
        console.log("Error getting prereveal URI:", err.message);
      }
      
      // Try tokenURI
      try {
        const tokenURI = await raccoons.tokenURI(1);
        console.log("Token 1 URI:", tokenURI);
      } catch (err) {
        console.error("TokenURI error:", err.message);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);