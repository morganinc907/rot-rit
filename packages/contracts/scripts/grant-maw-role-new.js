const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 Granting MAW_ROLE to new MawSacrifice contract...\n");
  
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  // Connect to Relics contract
  const relics = await ethers.getContractAt("Relics", RELICS);
  
  // Calculate MAW_ROLE hash
  const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  console.log(`🎯 MAW_ROLE: ${MAW_ROLE}`);
  
  try {
    // Check if role already granted
    const hasRole = await relics.hasRole(MAW_ROLE, NEW_MAW);
    console.log(`🔍 Current role status: ${hasRole ? 'GRANTED' : 'NOT GRANTED'}`);
    
    if (!hasRole) {
      console.log("Granting MAW_ROLE...");
      const tx = await relics.grantRole(MAW_ROLE, NEW_MAW, {
        gasLimit: 200000
      });
      await tx.wait();
      console.log(`✅ MAW_ROLE granted! Transaction: ${tx.hash}`);
      
      // Verify
      const newStatus = await relics.hasRole(MAW_ROLE, NEW_MAW);
      console.log(`✅ Verified: ${newStatus ? 'ROLE GRANTED' : 'ROLE NOT GRANTED'}`);
    } else {
      console.log("✅ MAW_ROLE already granted!");
    }
    
  } catch (error) {
    console.log(`❌ Failed to grant role: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});