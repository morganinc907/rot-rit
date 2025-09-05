const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Final authorization fix using setMawSacrifice...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  
  console.log("Proxy:", PROXY_ADDRESS);
  console.log("Relics:", RELICS_ADDRESS);
  
  try {
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    // Use setMawSacrifice which should grant the role
    console.log("Calling setMawSacrifice to ensure role is granted...");
    const tx = await relics.setMawSacrifice(PROXY_ADDRESS);
    await tx.wait();
    console.log("✅ setMawSacrifice completed:", tx.hash);
    
    // Now test sacrifice immediately
    console.log("\nTesting sacrifice right after authorization...");
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    const [signer] = await ethers.getSigners();
    
    // Check balance
    const balance = await relics.balanceOf(signer.address, 1);
    console.log("Rusted caps balance:", balance.toString());
    
    if (balance > 0) {
      console.log("Attempting real sacrifice...");
      const sacrificeTx = await maw.sacrificeKeys(1);
      await sacrificeTx.wait();
      console.log("🎉 SACRIFICE SUCCESS:", sacrificeTx.hash);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
