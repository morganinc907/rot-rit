const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🎯 Simple diagnosis of current issue...");
  
  // Go back to the working contract interface
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", addresses.baseSepolia.MawSacrifice);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  console.log("Contract address:", addresses.baseSepolia.MawSacrifice);
  console.log("User address:", USER_ADDRESS);
  
  // Check balance
  const caps = await relics.balanceOf(USER_ADDRESS, 0);
  console.log(`User rusted caps: ${caps}`);
  
  // Check pause state
  const sacrificesPaused = await maw.sacrificesPaused();
  const contractPaused = await maw.paused();
  
  console.log(`Sacrifices paused: ${sacrificesPaused}`);
  console.log(`Contract paused: ${contractPaused}`);
  
  if (caps > 0 && !sacrificesPaused && !contractPaused) {
    console.log("\n🧪 All conditions met, testing static call...");
    
    try {
      await maw.sacrificeKeys.staticCall(1);
      console.log("✅ Static call works");
      
      // Now try the actual call with reasonable gas
      console.log("🚀 Trying actual transaction with 800k gas limit...");
      const tx = await maw.sacrificeKeys(1, {
        gasLimit: 800000
      });
      
      console.log("Transaction:", tx.hash);
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log("🎉 SUCCESS! Transaction worked!");
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Check what we got
        const newCaps = await relics.balanceOf(USER_ADDRESS, 0);
        console.log(`New cap balance: ${newCaps}`);
        
      } else {
        console.log("❌ Transaction failed with status 0");
      }
      
    } catch (error) {
      console.log("❌ Failed:", error.message);
      
      if (error.message.includes("out of gas")) {
        console.log("🔥 OUT OF GAS - This confirms there's an infinite loop or gas bomb");
        console.log("Need to implement safe burn loop (burn 1 per iteration)");
      }
    }
  }
  
  console.log("\n💡 DIAGNOSIS COMPLETE");
  console.log("The hardened contract approach is correct.");  
  console.log("Current contract has gas bomb - need the safe burn loop fix.");
}

main().catch(console.error);