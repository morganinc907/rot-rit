const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔧 Authorizing new MawSacrifice...\n");

  const [deployer] = await ethers.getSigners();
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  console.log("New MawSacrifice:", addresses.mawSacrifice);
  console.log("Relics:", addresses.relics);
  
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  
  // Use higher gas price to avoid underpriced error
  const authTx = await relics.setMawSacrifice(addresses.mawSacrifice, {
    gasPrice: ethers.parseUnits("6", "gwei"), // Higher gas price
  });
  
  console.log("Transaction sent:", authTx.hash);
  await authTx.wait();
  console.log("✅ New MawSacrifice authorized in Relics!");
  
  // Test the authorization
  const storedAddress = await relics.mawSacrifice();
  console.log("Stored MawSacrifice:", storedAddress);
  console.log("Match:", storedAddress.toLowerCase() === addresses.mawSacrifice.toLowerCase() ? "✅" : "❌");
}

main().catch(console.error);