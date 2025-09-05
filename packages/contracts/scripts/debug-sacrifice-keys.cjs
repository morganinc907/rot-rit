const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Debugging sacrificeKeys function...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Check user's rusted cap balance (what sacrificeKeys needs)
  const rustedCapBalance = await relics.balanceOf(USER_ADDRESS, 0);
  console.log(`User rusted caps (ID 0): ${rustedCapBalance}`);
  
  // Check if sacrifices are paused
  const sacrificesPaused = await maw.sacrificesPaused();
  console.log(`Sacrifices paused: ${sacrificesPaused}`);
  
  // Check if contract is paused
  const contractPaused = await maw.paused();
  console.log(`Contract paused: ${contractPaused}`);
  
  if (rustedCapBalance >= 1) {
    // Try static call first
    console.log("\n🧪 Testing static call...");
    try {
      await maw.sacrificeKeys.staticCall(1, { from: USER_ADDRESS });
      console.log("✅ Static call succeeded");
    } catch (error) {
      console.log("❌ Static call failed:", error.message);
      if (error.data) {
        console.log("Error data:", error.data);
      }
    }
    
    // Try actual transaction
    console.log("\n🚀 Attempting sacrificeKeys...");
    try {
      const tx = await maw.sacrificeKeys(1, {
        gasLimit: 500000
      });
      console.log("Transaction:", tx.hash);
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        console.log("✅ sacrificeKeys worked!");
      } else {
        console.log("❌ Transaction failed");
      }
    } catch (error) {
      console.log("❌ Transaction failed:", error.message);
      if (error.data) {
        console.log("Error data:", error.data);
      }
    }
  } else {
    console.log("❌ User needs at least 1 rusted cap to sacrifice");
  }
}

main().catch(console.error);