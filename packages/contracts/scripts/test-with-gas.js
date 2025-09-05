const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Testing sacrificeKeys with explicit gas and fresh state...");
  
  const [signer] = await ethers.getSigners();
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    const keyBalance = await relics.balanceOf(signer.address, 1);
    console.log("Rusted caps balance:", keyBalance.toString());
    
    if (keyBalance > 0) {
      console.log("Attempting sacrifice with explicit gas...");
      try {
        const tx = await maw.sacrificeKeys(1, {
          gasLimit: 300000,
          gasPrice: ethers.parseUnits("2", "gwei")
        });
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ SUCCESS! Gas used:", receipt.gasUsed.toString());
      } catch (e) {
        console.log("❌ Failed:", e.message);
        
        // If it still fails, wait a few blocks and try again
        console.log("\nWaiting a few blocks and trying again...");
        await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
        
        try {
          const tx2 = await maw.sacrificeKeys(1);
          const receipt2 = await tx2.wait();
          console.log("✅ SUCCESS after waiting:", receipt2.hash);
        } catch (e2) {
          console.log("❌ Still failed after waiting:", e2.message);
        }
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
