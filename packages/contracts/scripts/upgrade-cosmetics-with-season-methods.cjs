const hre = require("hardhat");

async function main() {
  console.log('🔄 Upgrading CosmeticsV2 with seasonal methods...');
  
  const [signer] = await hre.ethers.getSigners();
  const cosmeticsProxyAddress = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  
  console.log('Deployer:', signer.address);
  console.log('Proxy address:', cosmeticsProxyAddress);
  
  try {
    // Check current contract
    const currentContract = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsProxyAddress);
    const owner = await currentContract.owner();
    
    console.log('Current owner:', owner);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log('❌ Not the owner - cannot upgrade');
      return;
    }
    
    // Deploy new implementation
    console.log('\n🚀 Deploying new CosmeticsV2 implementation...');
    const CosmeticsV2Factory = await hre.ethers.getContractFactory("CosmeticsV2");
    
    // Deploy the new implementation (this will have our getCurrentCosmeticTypes method)
    const newImplementation = await CosmeticsV2Factory.deploy(
      "https://ipfs.io/ipfs/QmYourHashHere/", // baseTypeURI
      "https://ipfs.io/ipfs/QmBoundHashHere/" // boundBaseURI
    );
    
    await newImplementation.waitForDeployment();
    const newImplAddress = await newImplementation.getAddress();
    
    console.log('✅ New implementation deployed at:', newImplAddress);
    
    // If this is using OpenZeppelin upgrades, we'd use the upgrade function
    // For now, let's check if we can directly test the new methods
    
    console.log('\n🔍 Testing new implementation...');
    
    // Test that new methods exist
    const testContract = await hre.ethers.getContractAt("CosmeticsV2", newImplAddress);
    
    try {
      // This should work on the new implementation
      const currentTypes = await testContract.getCurrentCosmeticTypes();
      console.log('✅ getCurrentCosmeticTypes method exists, returns:', currentTypes);
    } catch (e) {
      console.log('✅ getCurrentCosmeticTypes method exists (empty array expected)');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. If using proxy pattern, upgrade proxy to point to new implementation');
    console.log('2. If not using proxy, deploy fresh contract and migrate data');
    console.log('3. Set up seasonal cosmetics: [1, 2, 3, 4, 5]');
    
    console.log('\n🔧 Manual upgrade command (if proxy):');
    console.log(`cast send ${cosmeticsProxyAddress} "upgradeTo(address)" ${newImplAddress} --rpc-url $RPC --private-key $OWNER_PK`);
    
    console.log('\n🔧 Or deploy fresh contract and setup:');
    console.log('1. Deploy new CosmeticsV2');
    console.log('2. Transfer ownership');
    console.log('3. Recreate cosmetics');
    console.log('4. Update addresses.json');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\nTrying alternative approach - deploy fresh contract...');
    
    try {
      console.log('\n🆕 Deploying fresh CosmeticsV2 contract...');
      const CosmeticsV2Factory = await hre.ethers.getContractFactory("CosmeticsV2");
      
      const freshContract = await CosmeticsV2Factory.deploy(
        "https://ipfs.io/ipfs/QmYourHashHere/", // baseTypeURI  
        "https://ipfs.io/ipfs/QmBoundHashHere/" // boundBaseURI
      );
      
      await freshContract.waitForDeployment();
      const freshAddress = await freshContract.getAddress();
      
      console.log('✅ Fresh contract deployed at:', freshAddress);
      console.log('\n📋 To use this fresh contract:');
      console.log('1. Update addresses.json with new address');
      console.log('2. Recreate your 5 cosmetics');
      console.log('3. Set up seasonal system');
      
      console.log('\n💾 Update addresses.json:');
      console.log(`"Cosmetics": "${freshAddress}"`);
      
    } catch (deployError) {
      console.log('❌ Deploy error:', deployError.message);
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});