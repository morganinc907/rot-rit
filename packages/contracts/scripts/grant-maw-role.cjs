const hre = require("hardhat");

async function main() {
  console.log('🔧 Granting MAW_ROLE to current MAW contract...');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('Signer:', signer.address);
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
  
  try {
    // Get MAW_ROLE hash
    const mawRole = await relics.MAW_ROLE();
    console.log('MAW_ROLE hash:', mawRole);
    
    // Check current status
    const hasRole = await relics.hasRole(mawRole, mawAddress);
    console.log('Current MAW has MAW_ROLE:', hasRole);
    
    if (hasRole) {
      console.log('✅ MAW already has the role');
      return;
    }
    
    // Grant the role
    console.log(`🔄 Granting MAW_ROLE to ${mawAddress}...`);
    const tx = await relics.grantRole(mawRole, mawAddress);
    console.log('Transaction sent:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    console.log('✅ MAW_ROLE granted successfully');
    
    // Verify
    const newHasRole = await relics.hasRole(mawRole, mawAddress);
    console.log('Verification - MAW has MAW_ROLE:', newHasRole);
    
  } catch (error) {
    console.log('❌ Error granting role:', error.message);
    
    if (error.message.includes('AccessControlUnauthorized')) {
      console.log('💡 Only admin can grant roles');
      
      try {
        const adminRole = await relics.DEFAULT_ADMIN_ROLE();
        const isAdmin = await relics.hasRole(adminRole, signer.address);
        console.log('Signer is admin:', isAdmin);
        
        if (!isAdmin) {
          console.log('❌ Signer does not have admin role');
          const owner = await relics.owner();
          console.log('Contract owner:', owner);
        }
      } catch (e) {
        console.log('Error checking admin role:', e.message);
      }
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});