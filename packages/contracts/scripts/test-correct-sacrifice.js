const { ethers } = require("hardhat");

async function main() {
  console.log("🔥 Testing sacrifice with CORRECT proxy address...");
  
  // Use the address from addresses.json (frontend uses this)
  const correctMawAddress = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const [deployer] = await ethers.getSigners();
  
  console.log(`👤 User: ${deployer.address}`);
  console.log(`🎯 Using CORRECT proxy address: ${correctMawAddress}`);
  
  try {
    const contract = await ethers.getContractAt("MawSacrificeV4NoTimelock", correctMawAddress);
    
    // Check current state
    const nonce = await contract.sacrificeNonce();
    console.log(`🔢 Current nonce: ${nonce}`);
    
    // Try sacrifice
    console.log("🔥 Attempting sacrifice...");
    const tx = await contract.sacrificeKeys(1);
    console.log("📤 Transaction sent, waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log(`✅ SUCCESS! Transaction: ${receipt.hash}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed}`);
    console.log(`📦 Block: ${receipt.blockNumber}`);
    
    // Check new nonce
    const newNonce = await contract.sacrificeNonce();
    console.log(`🔢 New nonce: ${newNonce}`);
    
  } catch (error) {
    console.log("❌ FAILED:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
