/**
 * Try to get more detailed error when granting BURNER_ROLE
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔍 Getting detailed error for grantRole...\n');
  
  const MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  try {
    // Try the role we computed
    const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
    console.log('🔥 BURNER_ROLE hash:', BURNER_ROLE);
    
    // Check if we have admin role to grant other roles
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const [signer] = await ethers.getSigners();
    
    const hasAdminRole = await relics.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
    console.log('👑 Signer has DEFAULT_ADMIN_ROLE:', hasAdminRole);
    
    // Check if BURNER_ROLE exists at all
    try {
      const roleAdminRole = await relics.getRoleAdmin(BURNER_ROLE);
      console.log('📋 BURNER_ROLE admin role:', roleAdminRole);
    } catch (e) {
      console.log('❌ Could not get BURNER_ROLE admin:', e.message);
    }
    
    // Try static call to see exact error
    try {
      await relics.grantRole.staticCall(BURNER_ROLE, MAW_ADDRESS);
      console.log('✅ grantRole would succeed');
    } catch (error) {
      console.log('❌ grantRole would fail with:', error);
      
      // Parse the error more deeply
      if (error.data) {
        console.log('Error data:', error.data);
      }
      if (error.reason) {
        console.log('Error reason:', error.reason);
      }
    }
    
    // Let's also try to see what roles exist and what we have
    console.log('\n🔍 Checking what roles the signer has...');
    const events = await relics.queryFilter(relics.filters.RoleGranted(null, signer.address));
    console.log('📋 RoleGranted events for signer:', events.length);
    for (const event of events.slice(0, 5)) {
      console.log(`  Role: ${event.args.role}, Account: ${event.args.account}`);
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
}

main().catch(console.error);