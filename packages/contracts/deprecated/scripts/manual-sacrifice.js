const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🎲 Manual sacrifice with explicit gas...\n");

  const [deployer] = await ethers.getSigners();
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  const maw = await ethers.getContractAt("MawSacrifice", addresses.mawSacrifice);
  
  console.log("Attempting sacrifice with explicit gas settings...");
  
  try {
    const tx = await maw.sacrificeKeys(1, {
      gasPrice: ethers.parseUnits("5", "gwei"),
      gasLimit: 200000, // Higher gas limit
    });
    
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
  } catch (error) {
    console.log("❌ Error:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
    if (error.reason) {
      console.log("Reason:", error.reason);
    }
  }
}

main().catch(console.error);