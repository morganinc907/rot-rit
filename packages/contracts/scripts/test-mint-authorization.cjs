const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Testing mint authorization directly...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  const [signer] = await ethers.getSigners();
  
  console.log("Testing each reward ID to find which ones are blocked:");
  
  // Test reward IDs 1-8
  for (let rewardId = 1; rewardId <= 8; rewardId++) {
    console.log(`\n🎯 Testing reward ID ${rewardId}:`);
    
    try {
      // First check supply limits
      let totalSupply, maxSupply;
      try {
        totalSupply = await relics.totalSupply(rewardId);
        maxSupply = await relics.maxSupply(rewardId);
        console.log(`  Supply: ${totalSupply}/${maxSupply}`);
        
        if (totalSupply >= maxSupply && maxSupply > 0) {
          console.log(`  ❌ SOLD OUT - this would cause mint to fail`);
          continue;
        }
      } catch (supplyError) {
        console.log(`  ⚠️ Could not check supply: ${supplyError.message}`);
      }
      
      // Try minting as the MAW proxy using impersonation
      await ethers.provider.send("hardhat_impersonateAccount", [PROXY_ADDRESS]);
      await ethers.provider.send("hardhat_setBalance", [PROXY_ADDRESS, "0x1000000000000000000"]);
      
      const mawSigner = await ethers.getSigner(PROXY_ADDRESS);
      const relicsAsMaw = relics.connect(mawSigner);
      
      await relicsAsMaw.mint.staticCall(USER_ADDRESS, rewardId, 1, "0x");
      console.log(`  ✅ Reward ID ${rewardId}: would mint successfully`);
      
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [PROXY_ADDRESS]);
      
    } catch (error) {
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [PROXY_ADDRESS]).catch(() => {});
      console.log(`  ❌ Reward ID ${rewardId}: would FAIL - ${error.message}`);
      
      // This is likely the reward ID causing the issue
      if (error.message.includes("AccessControl") || error.message.includes("Unauthorized") || error.message.includes("MaxSupply")) {
        console.log(`  🎯 THIS IS LIKELY THE PROBLEM REWARD ID!`);
      }
    }
  }
  
  console.log("\n🔍 Checking MAW role status:");
  try {
    const mawRole = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
    console.log(`MAW_ROLE hash: ${mawRole}`);
    
    // Try different approaches to check the role
    try {
      const hasRole = await relics.hasRole(mawRole, PROXY_ADDRESS);
      console.log(`MAW proxy has MAW_ROLE: ${hasRole}`);
    } catch (roleError) {
      console.log(`Could not check hasRole: ${roleError.message}`);
      
      // Try checking role admin
      try {
        const roleAdmin = await relics.getRoleAdmin(mawRole);
        console.log(`MAW_ROLE admin: ${roleAdmin}`);
      } catch (adminError) {
        console.log(`Could not check role admin: ${adminError.message}`);
      }
    }
  } catch (error) {
    console.log(`Error checking roles: ${error.message}`);
  }
}

main().catch(console.error);