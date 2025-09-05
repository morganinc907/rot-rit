const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Setting approval for user address...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A"; // Your address
  
  const [signer] = await ethers.getSigners();
  
  try {
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    console.log("📋 Setting up approval:");
    console.log("- Relics contract:", RELICS_ADDRESS);
    console.log("- MawSacrifice contract:", PROXY_ADDRESS);
    console.log("- User address:", USER_ADDRESS);
    console.log("- Signer address:", signer.address);
    
    // Check current approval status
    const currentApproval = await relics.isApprovedForAll(USER_ADDRESS, PROXY_ADDRESS);
    console.log(`- Current approval status: ${currentApproval}`);
    
    if (currentApproval) {
      console.log("✅ Already approved! Conversion should work now.");
      return;
    }
    
    console.log("🔐 Setting approval for all tokens...");
    
    // Note: This won't work because I can't sign for your address
    // But let me try a different approach - check if we can do it as owner
    
    console.log("❌ Cannot set approval - need to sign from your MetaMask address");
    console.log("\n📝 INSTRUCTIONS FOR YOU:");
    console.log("1. Go to Base Sepolia Etherscan");
    console.log("2. Navigate to Relics contract:", RELICS_ADDRESS);
    console.log("3. Connect your MetaMask wallet");
    console.log("4. Call setApprovalForAll with:");
    console.log(`   operator: ${PROXY_ADDRESS}`);
    console.log(`   approved: true`);
    console.log("5. Then try convertShardsToRustedCaps again");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);