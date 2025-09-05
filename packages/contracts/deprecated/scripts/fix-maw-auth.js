const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔧 Fixing MawSacrifice authorization...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  // Load addresses
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  console.log("MawSacrifice:", addresses.mawSacrifice);
  console.log("Relics:", addresses.relics);
  
  // Connect to contracts
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  const maw = await ethers.getContractAt("MawSacrifice", addresses.mawSacrifice);

  // Check if you have keys
  const keyBalance = await relics.balanceOf(deployer.address, 1);
  console.log("Your key balance:", keyBalance.toString());

  // Authorize MawSacrifice in Relics
  console.log("\n🔧 Authorizing MawSacrifice in Relics...");
  try {
    const tx = await relics.setMawSacrifice(addresses.mawSacrifice, {
      gasPrice: ethers.parseUnits("4", "gwei"),
    });
    await tx.wait();
    console.log("✅ MawSacrifice authorized in Relics");
  } catch (error) {
    console.log("❌ Authorization error:", error.message);
  }

  // Test sacrifice call
  console.log("\n🧪 Testing sacrifice call...");
  try {
    await maw.sacrificeKeys.staticCall(1);
    console.log("✅ Sacrifice call should work now");
  } catch (error) {
    console.log("❌ Sacrifice still failing:", error.message);
    
    // Check contract settings
    console.log("\n🔍 Checking MawSacrifice settings...");
    const paused = await maw.paused();
    const minBlocks = await maw.minBlocksBetweenSacrifices();
    const ashesPerVial = await maw.ashesPerVial();
    
    console.log("Contract paused:", paused);
    console.log("Min blocks between sacrifices:", minBlocks.toString());
    console.log("Ashes per vial:", ashesPerVial.toString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });