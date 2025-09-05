const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Fixing Cultists authorization with higher gas...");
  
  const [signer] = await ethers.getSigners();
  const networkAddresses = addresses.baseSepolia;
  const CORRECT_MAW = networkAddresses.MawSacrifice;
  
  try {
    const cultists = await ethers.getContractAt("Cultists", networkAddresses.Cultists);
    const tx = await cultists.setMawSacrifice(CORRECT_MAW, {
      gasLimit: 100000,
      gasPrice: ethers.parseUnits("2", "gwei")
    });
    await tx.wait();
    console.log("✅ Cultists updated:", tx.hash);
    
    // Also check what functions are available on the MawSacrifice contract
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", CORRECT_MAW);
    console.log("\nChecking MawSacrifice functions...");
    
    // Try different demon sacrifice function names
    const possibleFunctions = [
      "sacrificeForDemon",
      "summonDemon", 
      "ritualSacrifice",
      "sacrificeForSummoning"
    ];
    
    for (const funcName of possibleFunctions) {
      try {
        if (maw[funcName]) {
          console.log(`✅ Found function: ${funcName}`);
        }
      } catch (e) {
        console.log(`❌ Function not found: ${funcName}`);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
