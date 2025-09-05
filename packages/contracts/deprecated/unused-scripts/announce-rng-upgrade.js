/**
 * Announce RNG fix upgrade (step 1 of 2)
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('📢 Announcing RNG fix upgrade...\n');
  
  const MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Using account:', signer.address);
    
    // Deploy new implementation first
    console.log('🔨 Deploying new implementation...');
    const MawSacrificeV4Upgradeable = await ethers.getContractFactory("MawSacrificeV4Upgradeable");
    const newImplementation = await MawSacrificeV4Upgradeable.deploy();
    await newImplementation.waitForDeployment();
    
    const newImplAddress = await newImplementation.getAddress();
    console.log('📄 New implementation deployed at:', newImplAddress);
    
    // Announce the upgrade
    const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", MAW_ADDRESS);
    
    console.log('📢 Announcing upgrade...');
    const tx = await maw.announceUpgrade("RNG Fix Upgrade", newImplAddress);
    const receipt = await tx.wait();
    
    console.log('✅ Upgrade announced!');
    console.log('📝 Transaction:', tx.hash);
    
    // Get the upgrade ID from events
    for (const log of receipt.logs) {
      try {
        const parsed = maw.interface.parseLog(log);
        if (parsed.name === 'UpgradeAnnounced') {
          console.log('🆔 Upgrade ID:', parsed.args.upgradeId);
          console.log('⏰ Can execute after 24 hours');
        }
      } catch (e) {
        // Ignore unparseable logs
      }
    }
    
    console.log('\n⏳ You can execute the upgrade in 24 hours using the execute script');
    
  } catch (error) {
    console.error('❌ Announcement failed:', error.message);
  }
}

main().catch(console.error);