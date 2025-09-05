const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🎯 Testing sacrificeKeys with higher gas...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const [signer] = await ethers.getSigners();
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Check balances before
  const capsBefore = await relics.balanceOf(USER_ADDRESS, 0);
  console.log(`Rusted caps before: ${capsBefore}`);
  
  if (capsBefore < 1) {
    console.log("❌ Need at least 1 rusted cap to sacrifice");
    return;
  }
  
  // Try with much higher gas limit
  console.log("\n🚀 Attempting sacrificeKeys with high gas limit...");
  try {
    const tx = await maw.sacrificeKeys(1, {
      gasLimit: 1000000  // Much higher gas limit
    });
    console.log("Transaction:", tx.hash);
    
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      console.log("✅ sacrificeKeys worked!");
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // Check what we got
      const capsAfter = await relics.balanceOf(USER_ADDRESS, 0);
      console.log(`Rusted caps after: ${capsAfter}`);
      
      // Check for any new relics
      for (let i = 1; i <= 8; i++) {
        const balance = await relics.balanceOf(USER_ADDRESS, i);
        if (balance > 0) {
          console.log(`Relic ID ${i}: ${balance}`);
        }
      }
      
    } else {
      console.log("❌ Transaction failed (status 0)");
    }
    
  } catch (error) {
    console.log("❌ Transaction failed:", error.message);
    
    // Check if it's a gas issue
    if (error.message.includes("out of gas") || error.message.includes("gas")) {
      console.log("🔍 This appears to be a gas-related issue");
    }
  }
}

main().catch(console.error);