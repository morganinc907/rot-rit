const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking dev contract approval...");

  const [signer] = await ethers.getSigners();
  const userAddress = signer.address;
  
  // Dev contract address
  const devMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  
  // Get contracts
  const relics = await ethers.getContractAt("Relics", "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b");
  
  console.log(`User: ${userAddress}`);
  console.log(`Dev MawSacrifice: ${devMawAddress}`);
  
  // Check approvals
  const isApproved = await relics.isApprovedForAll(userAddress, devMawAddress);
  console.log(`Approved for dev contract: ${isApproved}`);
  
  // Check balances
  const fragments = await relics.balanceOf(userAddress, 2); // LANTERN_FRAGMENT = 2
  const masks = await relics.balanceOf(userAddress, 3); // WORM_EATEN_MASK = 3
  console.log(`Fragments: ${fragments}`);
  console.log(`Masks: ${masks}`);
  
  if (!isApproved) {
    console.log("❌ User needs to approve dev contract for relics!");
  } else {
    console.log("✅ User is approved for dev contract");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });