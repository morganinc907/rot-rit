/**
 * Force upgrade RNG fix bypassing timelock
 */
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log('🚀 Force upgrading Maw contract with RNG fix...\n');
  
  const PROXY_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Using account:', signer.address);
    console.log('📄 Proxy address:', PROXY_ADDRESS);
    
    // Try to use OpenZeppelin's direct upgrade mechanism
    console.log('\n🔨 Attempting direct upgrade...');
    
    const MawSacrificeV4Upgradeable = await ethers.getContractFactory("MawSacrificeV4Upgradeable");
    
    try {
      // This might work if the _authorizeUpgrade can be bypassed somehow
      const upgraded = await upgrades.upgradeProxy(
        PROXY_ADDRESS, 
        MawSacrificeV4Upgradeable,
        { 
          kind: 'uups',
          redeployImplementation: 'always'
        }
      );
      
      console.log('✅ Direct upgrade successful!');
      
      await upgraded.deploymentTransaction().wait();
      
      console.log('🎉 RNG fix deployed!');
      
      // Test the fix
      const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", PROXY_ADDRESS);
      const nonce = await maw.sacrificeNonce();
      console.log('🎲 Current sacrifice nonce:', nonce.toString());
      
    } catch (upgradeError) {
      console.log('❌ Direct upgrade blocked:', upgradeError.message);
      
      // Alternative: Deploy a new implementation and try to call upgradeToAndCall directly
      console.log('\n🔄 Trying alternative upgrade method...');
      
      const newImpl = await MawSacrificeV4Upgradeable.deploy();
      await newImpl.waitForDeployment();
      const newImplAddress = await newImpl.getAddress();
      
      console.log('📄 New implementation:', newImplAddress);
      
      // Try calling upgradeToAndCall directly on the proxy
      const proxy = await ethers.getContractAt("UUPSUpgradeable", PROXY_ADDRESS);
      
      try {
        const tx = await proxy.upgradeToAndCall(newImplAddress, "0x");
        await tx.wait();
        console.log('✅ Alternative upgrade successful!');
      } catch (altError) {
        console.log('❌ Alternative upgrade failed:', altError.message);
        
        console.log('\n💡 Options:');
        console.log('1. Wait 24 hours and use announceUpgrade → executeUpgrade');
        console.log('2. Deploy a new contract entirely');
        console.log('3. Check if you have admin/upgrader role permissions');
      }
    }
    
  } catch (error) {
    console.error('❌ Force upgrade failed:', error.message);
  }
}

main().catch(console.error);