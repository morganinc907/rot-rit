const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔍 Finding your new MawSacrifice contract address...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Checking transactions for account:", deployer.address);

  // Get recent transactions
  const provider = deployer.provider;
  const currentBlock = await provider.getBlockNumber();
  console.log("Current block:", currentBlock);

  // Look at recent blocks for contract deployments
  console.log("\n🔍 Scanning recent transactions...");
  
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  console.log("Current MawSacrifice in config:", addresses.mawSacrifice);

  // Check if current MawSacrifice still works
  try {
    const currentMaw = await ethers.getContractAt("MawSacrifice", addresses.mawSacrifice);
    const ashesPerVial = await currentMaw.ashesPerVial();
    console.log("Current MawSacrifice ashesPerVial:", ashesPerVial.toString());
    
    if (ashesPerVial.toString() === "25") {
      console.log("✅ Current MawSacrifice is already the fixed version!");
      return;
    } else {
      console.log("❌ Current MawSacrifice still has old ashesPerVial (50)");
    }
  } catch (error) {
    console.log("❌ Current MawSacrifice not accessible:", error.message);
  }

  console.log("\n🔍 You need to provide the new MawSacrifice address from your deployment.");
  console.log("Look for a line like: '✅ Fixed MawSacrifice deployed to: 0x...'");
  console.log("\nOnce you provide the address, I can update the config file.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });