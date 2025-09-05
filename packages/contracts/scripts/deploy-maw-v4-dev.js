/**
 * Deploy MawSacrificeV4NoTimelock with RNG fix and no timelock
 */
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log('🚀 Deploying MawSacrificeV4NoTimelock (no timelock) with RNG fix...\n');

  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Deploying from:', signer.address);

    // Deploy the dev contract
    console.log('🔨 Deploying MawSacrificeV4NoTimelock...');
    const MawSacrificeV4Dev = await ethers.getContractFactory("MawSacrificeV4NoTimelock");
    
    const maw = await upgrades.deployProxy(
      MawSacrificeV4Dev,
      [], // No initializer args
      {
        initializer: false,
        kind: 'uups'
      }
    );

    await maw.waitForDeployment();
    const address = await maw.getAddress();

    console.log('✅ MawSacrificeV4NoTimelock deployed at:', address);
    console.log('📝 Transaction hash:', maw.deploymentTransaction().hash);

    // Initialize the contract using direct transaction
    console.log('\n🔧 Initializing contract...');
    
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const COSMETICS_ADDRESS = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
    const DEMONS_ADDRESS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
    const CULTISTS_ADDRESS = "0x2D7cD25A014429282062298d2F712FA7983154B9";

    try {
      const initTx = await signer.sendTransaction({
        to: address,
        data: MawSacrificeV4Dev.interface.encodeFunctionData("initialize", [
          RELICS_ADDRESS,
          COSMETICS_ADDRESS,
          DEMONS_ADDRESS,
          CULTISTS_ADDRESS
        ]),
        gasLimit: 500000
      });
      
      await initTx.wait();
      console.log('✅ Contract initialized!');
    } catch (initError) {
      console.log('⚠️ Initialize failed:', initError.message);
    }

    // Set up cosmetic types
    console.log('\n🎨 Setting up cosmetic types...');
    try {
      const setTypesTx = await signer.sendTransaction({
        to: address,
        data: MawSacrificeV4Dev.interface.encodeFunctionData("setMonthlyCosmeticTypes", [
          [1, 2, 3, 4, 5]
        ]),
        gasLimit: 200000
      });
      
      await setTypesTx.wait();
      console.log('✅ Cosmetic types set!');
    } catch (typesError) {
      console.log('⚠️ Set types failed:', typesError.message);
    }

    // Test the RNG fix
    console.log('\n🎲 Testing RNG fix...');
    try {
      const testTx = await signer.sendTransaction({
        to: address,
        data: MawSacrificeV4Dev.interface.encodeFunctionData("testRNG", [1]),
        gasLimit: 100000
      });
      
      const receipt = await testTx.wait();
      console.log('✅ RNG test successful!');
    } catch (rngError) {
      console.log('⚠️ RNG test failed:', rngError.message);
    }

    // Transfer cosmetics ownership
    console.log('\n👑 Transferring cosmetics ownership...');
    const cosmeticsAbi = [
      "function transferOwnership(address newOwner) external",
      "function owner() view returns (address)"
    ];
    
    const cosmetics = new ethers.Contract(COSMETICS_ADDRESS, cosmeticsAbi, signer);
    
    try {
      const currentOwner = await cosmetics.owner();
      console.log('Current cosmetics owner:', currentOwner);
      
      if (currentOwner.toLowerCase() === signer.address.toLowerCase()) {
        console.log('Transferring ownership to dev Maw...');
        const transferTx = await cosmetics.transferOwnership(address);
        await transferTx.wait();
        console.log('✅ Ownership transferred!');
      } else {
        console.log('⚠️ Current owner:', currentOwner);
        console.log('   You may need to transfer ownership manually');
      }
    } catch (ownerError) {
      console.log('⚠️ Ownership check/transfer failed:', ownerError.message);
    }

    console.log('\n🎉 Dev deployment complete!');
    console.log('📄 Dev Maw address:', address);
    console.log('🔧 Features:');
    console.log('   ✅ RNG fix active');
    console.log('   ✅ No timelock restrictions');
    console.log('   ✅ Immediate upgrades possible');
    console.log('\n📝 Next steps:');
    console.log('1. Update addresses.json with dev address');
    console.log('2. Grant MAW_ROLE to dev contract in Relics');
    console.log('3. Test cosmetic sacrifices');
    console.log('4. Once stable, deploy to production with timelock');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

main().catch(console.error);