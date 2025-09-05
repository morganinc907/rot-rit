/**
 * Deploy new MawSacrificeV4Upgradeable with RNG fix
 */
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log('🚀 Deploying MawSacrificeV4Upgradeable with RNG fix...\n');

  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Deploying from:', signer.address);

    // Deploy the contract
    console.log('🔨 Deploying MawSacrificeV4Upgradeable...');
    const MawSacrificeV4Upgradeable = await ethers.getContractFactory("MawSacrificeV4Upgradeable");
    
    const maw = await upgrades.deployProxy(
      MawSacrificeV4Upgradeable,
      [], // No initializer args needed
      {
        initializer: false, // We'll initialize manually
        kind: 'uups'
      }
    );

    await maw.waitForDeployment();
    const address = await maw.getAddress();

    console.log('✅ MawSacrificeV4Upgradeable deployed at:', address);
    console.log('📝 Transaction hash:', maw.deploymentTransaction().hash);

    // Initialize the contract
    console.log('\n🔧 Initializing contract...');
    
    // Get addresses from environment or use existing ones
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
    const DEMONS_ADDRESS = "0x742d1C8080Cfdf5b3E5fC2F68CFE7b1f4a86F50F";
    const CULTISTS_ADDRESS = "0x2A24a5998D7B0F0c8F6c4a38aC7E57F5f8D6E5f9"; // Need actual address

    // Initialize with direct ABI call to avoid fragment issues
    const initData = maw.interface.encodeFunctionData("initialize", [
      RELICS_ADDRESS,
      COSMETICS_ADDRESS, 
      DEMONS_ADDRESS,
      CULTISTS_ADDRESS
    ]);
    
    const initTx = await signer.sendTransaction({
      to: address,
      data: initData
    });
    
    await initTx.wait();
    console.log('✅ Contract initialized!');

    // Set up cosmetic types
    console.log('\n🎨 Setting up cosmetic types...');
    const setTypesTx = await maw.setMonthlyCosmeticTypes([1, 2, 3, 4, 5]);
    await setTypesTx.wait();
    console.log('✅ Cosmetic types set!');

    // Transfer cosmetics ownership to new contract
    console.log('\n👑 Transferring cosmetics ownership...');
    const cosmeticsAbi = [
      "function transferOwnership(address newOwner) external",
      "function owner() view returns (address)"
    ];
    
    const cosmetics = new ethers.Contract(COSMETICS_ADDRESS, cosmeticsAbi, signer);
    const currentOwner = await cosmetics.owner();
    
    if (currentOwner.toLowerCase() === signer.address.toLowerCase()) {
      const transferTx = await cosmetics.transferOwnership(address);
      await transferTx.wait();
      console.log('✅ Cosmetics ownership transferred to new Maw contract!');
    } else {
      console.log('⚠️ You do not own cosmetics contract, transfer ownership manually');
    }

    console.log('\n🎉 Deployment complete!');
    console.log('📄 New Maw address:', address);
    console.log('\n🔧 Next steps:');
    console.log('1. Update addresses.json with new address');
    console.log('2. Grant MAW_ROLE to new contract in Relics');
    console.log('3. Update frontend to use new address');
    console.log('\n✅ RNG fix is now active - cosmetics should work properly!');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

main().catch(console.error);