/**
 * Try to find the exact BURNER_ROLE hash and grant it
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔥 Finding BURNER_ROLE...\n');
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  try {
    // Try different possible role names
    const roleNames = [
      "BURNER_ROLE",
      "BURNER",
      "BURN_ROLE", 
      "MINTER_ROLE",
      "MINTER"
    ];
    
    console.log('🔍 Trying role constants...');
    let burnerRole = null;
    
    for (const roleName of roleNames) {
      try {
        const role = await relics[roleName]();
        console.log(`✅ ${roleName}:`, role);
        burnerRole = role;
        break;
      } catch (e) {
        console.log(`❌ ${roleName}: not found`);
      }
    }
    
    // If no constant found, try computing common role hashes
    if (!burnerRole) {
      console.log('\n🔍 Computing role hashes...');
      const computedRoles = [
        { name: "BURNER_ROLE", hash: ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE")) },
        { name: "BURNER", hash: ethers.keccak256(ethers.toUtf8Bytes("BURNER")) },
        { name: "MINTER_ROLE", hash: ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")) },
      ];
      
      for (const role of computedRoles) {
        console.log(`🔥 ${role.name}: ${role.hash}`);
        
        // Check if proxy has this role
        try {
          const hasRole = await relics.hasRole(role.hash, PROXY_ADDRESS);
          console.log(`   Proxy has ${role.name}:`, hasRole);
          
          if (!hasRole && !burnerRole) {
            burnerRole = role.hash;
            console.log(`   📋 Will try to grant ${role.name}`);
          }
        } catch (e) {
          console.log(`   ❌ hasRole check failed for ${role.name}`);
        }
      }
    }
    
    // Try to grant the role
    if (burnerRole) {
      console.log('\n🔧 Granting burner role to proxy...');
      try {
        const tx = await relics.grantRole(burnerRole, PROXY_ADDRESS);
        console.log('📝 Transaction sent:', tx.hash);
        await tx.wait();
        console.log('✅ Role granted!');
        
        // Verify it worked
        const hasRole = await relics.hasRole(burnerRole, PROXY_ADDRESS);
        console.log('📋 Proxy now has role:', hasRole);
        
        // Test burning
        console.log('\n🧪 Testing burn authorization...');
        try {
          await relics.burn.staticCall(PROXY_ADDRESS, 2, 1);
          console.log('✅ SUCCESS: Proxy can now burn relics!');
        } catch (e) {
          console.log('❌ Burn still fails:', e.message.split('\n')[0]);
        }
        
      } catch (e) {
        console.log('❌ grantRole failed:', e.message);
        
        // If it failed, maybe we need to use the exact role hash from events
        console.log('\n🔍 Looking for role events...');
        try {
          const filter = relics.filters.RoleGranted();
          const events = await relics.queryFilter(filter, -1000); // Last 1000 blocks
          
          console.log(`📋 Found ${events.length} RoleGranted events:`);
          const roles = new Set();
          
          for (const event of events.slice(-10)) { // Show last 10
            console.log(`   Role: ${event.args.role}, Account: ${event.args.account}`);
            roles.add(event.args.role);
          }
          
          console.log('\n🔥 Unique roles found:', Array.from(roles));
          
        } catch (e) {
          console.log('❌ Could not query events');
        }
      }
    } else {
      console.log('\n❌ Could not determine BURNER_ROLE hash');
    }
    
  } catch (error) {
    console.error('❌ Role finding failed:', error.message);
  }
}

main().catch(console.error);