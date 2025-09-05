/**
 * Setup the dev contract with proper initialization and permissions
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔧 Setting up dev contract...\n');
  
  const DEV_MAW_ADDRESS = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const DEMONS_ADDRESS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Using account:', signer.address);
    
    // Initialize the contract using direct transaction
    console.log('🔧 Initializing dev contract...');
    
    const mawAbi = [
      "function initialize(address _relics, address _cosmetics, address _demons, address _cultists) external",
      "function setMonthlyCosmeticTypes(uint256[] calldata cosmeticTypeIds) external", 
      "function sacrificeNonce() view returns (uint256)",
      "function testRNG(uint256 nonce) view returns (uint256)"
    ];
    
    const maw = new ethers.Contract(DEV_MAW_ADDRESS, mawAbi, signer);
    
    try {
      const initTx = await maw.initialize(
        RELICS_ADDRESS,
        COSMETICS_ADDRESS,
        DEMONS_ADDRESS,
        "0x0000000000000000000000000000000000000000", // Zero address for cultists
        { gasLimit: 500000 }
      );
      await initTx.wait();
      console.log('✅ Contract initialized!');
    } catch (e) {
      console.log('⚠️ Initialize failed (might already be initialized):', e.message.split('\n')[0]);
    }
    
    // Set cosmetic types
    console.log('\n🎨 Setting cosmetic types...');
    try {
      const setTypesTx = await maw.setMonthlyCosmeticTypes([1, 2, 3, 4, 5], {
        gasLimit: 200000
      });
      await setTypesTx.wait();
      console.log('✅ Cosmetic types set!');
    } catch (e) {
      console.log('⚠️ Set types failed:', e.message.split('\n')[0]);
    }
    
    // Grant MAW_ROLE to dev contract in Relics
    console.log('\n🔑 Granting MAW_ROLE to dev contract...');
    const relicsAbi = [
      "function grantRole(bytes32 role, address account) external",
      "function hasRole(bytes32 role, address account) view returns (bool)"
    ];
    
    const relics = new ethers.Contract(RELICS_ADDRESS, relicsAbi, signer);
    const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
    
    try {
      const hasRole = await relics.hasRole(MAW_ROLE, DEV_MAW_ADDRESS);
      if (!hasRole) {
        const grantTx = await relics.grantRole(MAW_ROLE, DEV_MAW_ADDRESS);
        await grantTx.wait();
        console.log('✅ MAW_ROLE granted!');
      } else {
        console.log('✅ Already has MAW_ROLE');
      }
    } catch (e) {
      console.log('⚠️ Grant role failed:', e.message.split('\n')[0]);
    }
    
    // Transfer cosmetics ownership to dev contract
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
        const transferTx = await cosmetics.transferOwnership(DEV_MAW_ADDRESS);
        await transferTx.wait();
        console.log('✅ Ownership transferred to dev contract!');
      } else if (currentOwner.toLowerCase() === "0x09cb2813f07105385f76e5917c3b68c980a91e73") {
        console.log('⚠️ Cosmetics owned by old Maw contract - need to transfer from there first');
      } else {
        console.log('⚠️ Current owner needs to transfer ownership manually');
      }
    } catch (e) {
      console.log('⚠️ Ownership check/transfer failed:', e.message.split('\n')[0]);
    }
    
    // Test the RNG fix
    console.log('\n🎲 Testing RNG fix...');
    try {
      const nonce = await maw.sacrificeNonce();
      console.log('Current sacrifice nonce:', nonce.toString());
      
      // Test RNG with different nonces
      const rng1 = await maw.testRNG(1);
      const rng2 = await maw.testRNG(2);
      const rng3 = await maw.testRNG(3);
      
      console.log('RNG results:');
      console.log(`  Nonce 1: ${rng1.toString()}`);
      console.log(`  Nonce 2: ${rng2.toString()}`);
      console.log(`  Nonce 3: ${rng3.toString()}`);
      
      if (rng1.toString() !== rng2.toString()) {
        console.log('✅ RNG is working - different nonces give different results!');
      } else {
        console.log('⚠️ RNG might still have issues');
      }
    } catch (e) {
      console.log('⚠️ RNG test failed:', e.message.split('\n')[0]);
    }
    
    console.log('\n🎉 Dev contract setup complete!');
    console.log('📄 Dev Maw address:', DEV_MAW_ADDRESS);
    console.log('✅ Ready for cosmetic sacrifice testing!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

main().catch(console.error);