const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking relics burn authorization...");

  const [signer] = await ethers.getSigners();
  
  // Contract addresses
  const devMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const oldMawAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456"; // Working proxy
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  console.log(`Dev Contract: ${devMawAddress}`);
  console.log(`Old Contract: ${oldMawAddress}`) ;
  console.log(`Relics Contract: ${relicsAddress}`);
  
  // Get relics contract
  const relics = await ethers.getContractAt("Relics", relicsAddress);
  
  // Check what functions the relics contract has for authorization
  console.log("\n🔍 Checking relics contract interface...");
  
  // Try common authorization patterns
  try {
    const owner = await relics.owner();
    console.log(`Owner: ${owner}`);
  } catch (e) {
    console.log("No owner() function");
  }
  
  try {
    const mawSacrifice = await relics.mawSacrifice();
    console.log(`Authorized MawSacrifice: ${mawSacrifice}`);
  } catch (e) {
    console.log("No mawSacrifice() function");
  }
  
  try {
    const authorizedBurner = await relics.authorizedBurner();
    console.log(`Authorized Burner: ${authorizedBurner}`);
  } catch (e) {
    console.log("No authorizedBurner() function");
  }
  
  // Check if relics has a setMawSacrifice function to authorize the new contract
  console.log("\n🔍 Testing authorization methods...");
  try {
    // This will tell us what functions are available
    const interface = relics.interface;
    const functions = Object.keys(interface.functions);
    console.log("Available functions:");
    functions.forEach(func => {
      if (func.includes('maw') || func.includes('burn') || func.includes('auth')) {
        console.log(`  - ${func}`);
      }
    });
  } catch (e) {
    console.log("Could not list functions");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });