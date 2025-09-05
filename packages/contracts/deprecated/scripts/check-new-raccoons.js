const hre = require("hardhat");

const RACCOONS_ADDRESS = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";
const YOUR_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";

async function main() {
  console.log("Checking new raccoons contract...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  try {
    // Basic contract info
    const balance = await raccoons.balanceOf(YOUR_ADDRESS);
    console.log("Your balance:", balance.toString());
    
    if (balance > 0) {
      const tokenId = await raccoons.tokenOfOwnerByIndex(YOUR_ADDRESS, 0);
      console.log("Token ID:", tokenId.toString());
      
      // Check token state
      const state = await raccoons.getState(tokenId);
      console.log("Current state:", state, state == 0 ? "(Normal)" : state == 1 ? "(Cult)" : "(Dead)");
      
      // Try to get tokenURI with error handling
      try {
        const uri = await raccoons.tokenURI(tokenId);
        console.log("TokenURI:", uri);
      } catch (uriError) {
        console.log("TokenURI error:", uriError.message);
        
        // Check contract config
        const revealed = await raccoons.revealed();
        const baseURI = await raccoons.baseTokenURI();
        const preRevealURI = await raccoons.preRevealURI();
        const cosmetics = await raccoons.cosmetics();
        
        console.log("Contract config:");
        console.log("- Revealed:", revealed);
        console.log("- Base URI:", baseURI);
        console.log("- Pre-reveal URI:", preRevealURI);
        console.log("- Cosmetics address:", cosmetics);
        
        // Test individual parts of the tokenURI logic
        console.log("Testing tokenURI components...");
        
        if (!revealed) {
          console.log("Would return pre-reveal URI");
        } else if (state == 1) {
          console.log("Should return cult.json");
        } else if (state == 2) {
          console.log("Should return dead.json");
        } else {
          console.log("Should check for cosmetics and return normal tokenURI");
        }
      }
      
      // Test joinCult function call (simulate)
      console.log("\nTesting joinCult function availability...");
      try {
        // Just check if the function exists by calling it with gas estimation
        const gasEstimate = await raccoons.joinCult.estimateGas(tokenId);
        console.log("joinCult gas estimate:", gasEstimate.toString());
        console.log("✅ joinCult function is available and callable");
      } catch (cultError) {
        console.log("❌ joinCult error:", cultError.message);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);