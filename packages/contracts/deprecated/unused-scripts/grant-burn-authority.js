/**
 * Grant burn authority to the Maw contract so it can burn relics during sacrifices
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔧 Granting burn authorization to Maw contract...\n');
  
  const MAW_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456"; // V3 Proxy that frontend uses
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  console.log('📄 Maw contract:', MAW_ADDRESS);
  console.log('📄 Relics contract:', RELICS_ADDRESS);
  
  const [signer] = await ethers.getSigners();
  console.log('👤 Signer (owner):', signer.address);
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  try {
    // Verify we're the owner
    const owner = await relics.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log('❌ You are not the owner of the Relics contract');
      console.log('   Owner:', owner);
      console.log('   Your address:', signer.address);
      return;
    }
    
    console.log('✅ Confirmed: You are the owner of Relics\n');
    
    // Check current authorization
    try {
      await relics.burn.staticCall(MAW_ADDRESS, 1, 1);
      console.log('✅ Maw already has burn authorization');
      return;
    } catch (error) {
      console.log('❌ Maw does NOT have burn authorization');
      console.log('   Error:', error.message);
    }
    
    // Look for authorization functions
    console.log('\n🔍 Looking for authorization functions...');
    
    // Try common function names
    const possibleFunctions = [
      'setBurner',
      'addBurner', 
      'authorizeBurner',
      'grantRole',
      'setApprovalForAll' // Maybe it uses this?
    ];
    
    for (const funcName of possibleFunctions) {
      try {
        const func = relics[funcName];
        if (func) {
          console.log(`📋 Found function: ${funcName}`);
        }
      } catch (e) {
        // Function doesn't exist
      }
    }
    
    // Try role-based approach first since we found grantRole
    try {
      console.log('\n🧪 Trying role-based authorization (AccessControl)...');
      
      // Get the BURNER_ROLE if it exists
      let BURNER_ROLE;
      try {
        // Try common role constant names
        BURNER_ROLE = await relics.BURNER_ROLE();
        console.log('🔥 BURNER_ROLE constant:', BURNER_ROLE);
      } catch (e) {
        // Maybe it's a computed role hash
        BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
        console.log('🔥 Computed BURNER_ROLE hash:', BURNER_ROLE);
      }
      
      // Grant the role
      console.log('📝 Granting BURNER_ROLE to Maw contract...');
      const tx = await relics.grantRole(BURNER_ROLE, MAW_ADDRESS);
      console.log('📝 Transaction sent:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      await tx.wait();
      console.log('✅ Transaction confirmed!');
      
      // Verify it worked
      await relics.burn.staticCall(MAW_ADDRESS, 1, 1);
      console.log('✅ SUCCESS: Maw now has burn authorization!');
      
    } catch (roleError) {
      console.log('❌ Role-based approach failed:', roleError.message);
      
      // Try setBurner as fallback
      try {
        console.log('\n🧪 Trying setBurner approach...');
        const tx = await relics.setBurner(MAW_ADDRESS, true);
        console.log('📝 Transaction sent:', tx.hash);
        await tx.wait();
        console.log('✅ setBurner succeeded!');
      } catch (setError) {
        console.log('❌ setBurner also failed:', setError.message);
        console.log('\nℹ️ Manual investigation needed:');
        console.log('  1. Check the Relics contract source code');
        console.log('  2. Look for burn authorization functions');
        console.log('  3. The contract owner needs to authorize the Maw contract');
      }
    }
    
  } catch (error) {
    console.error('❌ Grant failed:', error.message);
  }
}

main().catch(console.error);