const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking user allowances and balances...");
  
  const [deployer] = await ethers.getSigners();
  const userAddress = deployer.address;
  console.log("👤 User:", userAddress);
  
  // Contract addresses
  const mawAddress = "0x15243987458f1ed05b02e6213b532bb060027f4c";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const cosmeticsAddress = "0xf77AC9cd10FCeF959cF86BA489D916B0716fA279";
  
  try {
    // Check keys balance
    const relicsContract = await ethers.getContractAt("Relics", relicsAddress);
    const keysBalance = await relicsContract.balanceOf(userAddress, 0);
    console.log(`🔑 Keys balance: ${keysBalance.toString()}`);
    
    // Check if Maw contract is approved to spend keys
    const isApproved = await relicsContract.isApprovedForAll(userAddress, mawAddress);
    console.log(`✅ Is approved for all: ${isApproved}`);
    
    // Check specific approval for token ID 0 (keys)
    const allowance = await relicsContract.balanceOf(userAddress, 0);
    console.log(`📊 Keys available: ${allowance.toString()}`);
    
    // Check if Maw contract is approved to mint cosmetics
    const cosmeticsContract = await ethers.getContractAt("MawCosmetics", cosmeticsAddress);
    
    // Check if Maw contract has MINTER_ROLE on cosmetics
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const hasMinterRole = await cosmeticsContract.hasRole(MINTER_ROLE, mawAddress);
    console.log(`🎨 Maw has MINTER_ROLE on cosmetics: ${hasMinterRole}`);
    
    // Check if Maw contract has BURN_AUTH_ROLE on relics
    const BURN_AUTH_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURN_AUTH_ROLE"));
    const hasBurnRole = await relicsContract.hasRole(BURN_AUTH_ROLE, mawAddress);
    console.log(`🔥 Maw has BURN_AUTH_ROLE on relics: ${hasBurnRole}`);
    
  } catch (error) {
    console.log("❌ Error checking allowances:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});