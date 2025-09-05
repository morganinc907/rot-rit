const hre = require("hardhat");

async function main() {
  console.log('🆕 Deploying fresh CosmeticsV2 with seasonal methods...');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('Deployer:', signer.address);
  
  try {
    const CosmeticsV2Factory = await hre.ethers.getContractFactory("CosmeticsV2");
    
    console.log('\n🚀 Deploying new CosmeticsV2 contract...');
    const cosmetics = await CosmeticsV2Factory.deploy(
      "https://ipfs.io/ipfs/QmYourHashHere/", // baseTypeURI
      "https://ipfs.io/ipfs/QmBoundHashHere/" // boundBaseURI
    );
    
    await cosmetics.waitForDeployment();
    const contractAddress = await cosmetics.getAddress();
    
    console.log('✅ CosmeticsV2 deployed at:', contractAddress);
    
    // Test new methods
    console.log('\n🔍 Testing new methods...');
    
    const currentTypes = await cosmetics.getCurrentCosmeticTypes();
    console.log('getCurrentCosmeticTypes():', currentTypes);
    
    const owner = await cosmetics.owner();
    console.log('Owner:', owner);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Update addresses.json');
    console.log('2. Recreate your 5 cosmetics');
    console.log('3. Set up seasonal system');
    console.log('4. Configure MAW sacrifice pool');
    
    console.log('\n💾 addresses.json update:');
    console.log(`"Cosmetics": "${contractAddress}"`);
    
    return contractAddress;
    
  } catch (error) {
    console.log('❌ Deploy error:', error.message);
    throw error;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { main };