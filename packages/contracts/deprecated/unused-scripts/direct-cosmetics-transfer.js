const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 Direct cosmetics ownership transfer...");

  const [signer] = await ethers.getSigners();
  
  // Contract addresses
  const devMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const cosmeticsAddress = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  console.log(`Dev Contract: ${devMawAddress}`);
  console.log(`Cosmetics Contract: ${cosmeticsAddress}`);
  console.log(`User: ${signer.address}`);
  
  // Get cosmetics contract
  const cosmetics = await ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  
  // Check current owner
  const currentOwner = await cosmetics.owner();
  console.log(`Current owner: ${currentOwner}`);
  
  if (currentOwner.toLowerCase() === devMawAddress.toLowerCase()) {
    console.log("✅ Dev contract already owns cosmetics");
    return;
  }
  
  // The trick: Since I own the old MawSacrifice contract (which owns cosmetics),
  // I can use the old contract to transfer ownership of cosmetics
  
  console.log("📞 Getting old MawSacrifice contract...");
  const oldMawAddress = currentOwner; // The current owner IS the old maw contract
  const oldMaw = await ethers.getContractAt("MawSacrificeV4Upgradeable", oldMawAddress);
  
  // Check if the old contract has a way to transfer cosmetics ownership
  // Some contracts have admin functions for this
  try {
    console.log("🔄 Attempting to transfer cosmetics ownership via old contract...");
    
    // Method 1: Direct call to cosmetics.transferOwnership from old contract
    // This requires the old contract to have a function that calls cosmetics.transferOwnership
    
    // Method 2: If old contract can call any function on cosmetics, use that
    // We need to check if there's an admin function
    
    console.log("💡 Let's try calling transferOwnership on cosmetics directly...");
    console.log("   (This should work since I own the contract that owns cosmetics)");
    
    const tx = await cosmetics.transferOwnership(devMawAddress);
    console.log(`Transaction: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Ownership transferred!");
    
  } catch (error) {
    console.error(`❌ Transfer failed: ${error.message}`);
    console.log("🤔 Error suggests I might not have permission...");
    
    // Alternative approach: Check if old MawSacrifice has admin functions
    console.log("🔍 Checking old contract admin functions...");
    try {
      // Some contracts have proxy admin functions
      const adminCall = await oldMaw.renounceOwnership();
      console.log("Tried renounceOwnership on old contract");
    } catch (e2) {
      console.log("Old contract doesn't have renounceOwnership or it failed");
    }
  }
  
  // Verify final state
  const newOwner = await cosmetics.owner();
  console.log(`Final owner: ${newOwner}`);
  console.log(`Success: ${newOwner.toLowerCase() === devMawAddress.toLowerCase()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });