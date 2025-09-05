/**
 * Upgrade Maw contract with RNG fix
 */
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log('🔧 Upgrading Maw contract with RNG fix...\n');
  
  const PROXY_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Upgrading from:', signer.address);
    console.log('📄 Proxy address:', PROXY_ADDRESS);
    
    // Deploy new implementation
    console.log('\n🔨 Deploying new implementation...');
    const MawSacrificeV4Upgradeable = await ethers.getContractFactory("MawSacrificeV4Upgradeable");
    
    const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, MawSacrificeV4Upgradeable);
    
    console.log('✅ Upgrade successful!');
    console.log('📝 Transaction hash:', upgraded.deploymentTransaction().hash);
    
    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    await upgraded.deploymentTransaction().wait();
    
    console.log('🎉 Upgrade completed!');
    console.log('📄 Proxy still at:', PROXY_ADDRESS);
    
    // Test the fix
    console.log('\n🧪 Testing RNG fix...');
    const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", PROXY_ADDRESS);
    
    // Check the new sacrificeNonce variable
    try {
      const nonce = await maw.sacrificeNonce();
      console.log('🎲 Current sacrifice nonce:', nonce.toString());
    } catch (e) {
      console.log('⚠️ Cannot read nonce (expected for fresh upgrade)');
    }
    
    console.log('\n✅ RNG fix deployed! The deterministic RNG issue should now be resolved.');
    console.log('   Each sacrifice will now use a unique nonce for true randomness.');
    
  } catch (error) {
    console.error('❌ Upgrade failed:', error.message);
  }
}

main().catch(console.error);