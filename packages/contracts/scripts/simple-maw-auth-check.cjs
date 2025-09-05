const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Simple MAW authorization check...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  try {
    // Try to get MAW_ROLE from the contract itself
    const mawRoleHash = await relics.MAW_ROLE();
    console.log("MAW_ROLE hash from contract:", mawRoleHash);
    
    const hasMawRole = await relics.hasRole(mawRoleHash, PROXY_ADDRESS);
    console.log("Proxy has MAW_ROLE:", hasMawRole);
    
    if (!hasMawRole) {
      console.log("\n❌ Proxy doesn't have MAW_ROLE - this is the problem!");
      
      // Check owner
      const owner = await relics.owner();
      console.log("Relics owner:", owner);
      
      const [signer] = await ethers.getSigners();
      console.log("Current signer:", signer.address);
      
      if (signer.address.toLowerCase() === owner.toLowerCase()) {
        console.log("✅ Current signer is owner - fixing authorization...");
        
        const tx = await relics.setMawSacrifice(PROXY_ADDRESS);
        console.log("setMawSacrifice transaction:", tx.hash);
        await tx.wait();
        
        // Check again
        const nowHasMawRole = await relics.hasRole(mawRoleHash, PROXY_ADDRESS);
        console.log("Proxy now has MAW_ROLE:", nowHasMawRole);
        
        if (nowHasMawRole) {
          console.log("🎉 Authorization fixed! Now testing conversion...");
          
          // Test canMintCaps
          const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
          const canMint = await maw.canMintCaps(1);
          console.log("canMintCaps(1):", canMint);
          
          if (canMint) {
            console.log("✅ canMintCaps now works! Conversion should be fixed.");
          } else {
            console.log("❌ canMintCaps still returns false - there may be another issue");
          }
        }
      } else {
        console.log("❌ Current signer is not owner - cannot fix authorization");
      }
    } else {
      console.log("✅ Proxy already has MAW_ROLE");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);