const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 Checking cosmetics authorization...");

  const [signer] = await ethers.getSigners();
  
  // Contract addresses
  const devMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const cosmeticsAddress = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  console.log(`Dev Contract: ${devMawAddress}`);
  console.log(`Cosmetics Contract: ${cosmeticsAddress}`);
  
  // Get cosmetics contract
  const cosmetics = await ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  
  // Check what authorization methods exist
  console.log("\n🔍 Checking authorization methods...");
  
  try {
    const owner = await cosmetics.owner();
    console.log(`Owner: ${owner}`);
  } catch (e) {
    console.log("No owner() function");
  }
  
  try {
    const mawSacrifice = await cosmetics.mawSacrifice();
    console.log(`Authorized MawSacrifice: ${mawSacrifice}`);
  } catch (e) {
    console.log("No mawSacrifice() function");
  }
  
  // Check available functions
  try {
    const interface = cosmetics.interface;
    const functions = Object.keys(interface.functions);
    console.log("\nAvailable functions related to authorization:");
    functions.forEach(func => {
      if (func.includes('owner') || func.includes('maw') || func.includes('auth') || func.includes('transfer')) {
        console.log(`  - ${func}`);
      }
    });
  } catch (e) {
    console.log("Could not list functions");
  }
  
  // Check if we need to transfer ownership
  try {
    const currentOwner = await cosmetics.owner();
    if (currentOwner.toLowerCase() !== devMawAddress.toLowerCase()) {
      console.log(`\n💡 Need to transfer ownership from ${currentOwner} to ${devMawAddress}`);
    } else {
      console.log("\n✅ Dev contract already owns cosmetics");
    }
  } catch (e) {
    console.log("Could not check ownership");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });