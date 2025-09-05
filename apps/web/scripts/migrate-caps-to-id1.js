const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Converting user's token ID 0 to token ID 1...");
  
  const [deployer] = await ethers.getSigners();
  const userAddress = deployer.address;
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  console.log("User:", userAddress);
  console.log("Relics:", relicsAddress);
  
  // Get the relics contract
  const relics = await ethers.getContractAt("IERC1155", relicsAddress);
  
  // Check current balances
  const balanceId0 = await relics.balanceOf(userAddress, 0);
  const balanceId1 = await relics.balanceOf(userAddress, 1);
  
  console.log("\nCurrent balances:");
  console.log("- Token ID 0:", balanceId0.toString());
  console.log("- Token ID 1:", balanceId1.toString());
  
  if (balanceId0 == 0) {
    console.log("❌ No tokens at ID 0 to convert");
    return;
  }
  
  // For this to work, the deployer would need to have ADMIN/MINTER role on the relics contract
  // Since we can't burn/mint directly, we need to find a contract that can do this conversion
  
  // Alternative: Check if there's a migration function in the contracts
  console.log("\n⚠️  Direct migration requires admin privileges on relics contract");
  console.log("💡 Recommendation: Deploy a migration contract or use existing admin functions");
  
  // Show what the transaction would look like:
  console.log("\nRequired operations:");
  console.log(`1. burn(${userAddress}, 0, ${balanceId0})`);
  console.log(`2. mint(${userAddress}, 1, ${balanceId0}, "")`);
}

main().catch(console.error);