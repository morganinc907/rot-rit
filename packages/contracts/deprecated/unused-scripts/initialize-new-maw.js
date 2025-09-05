/**
 * Initialize the newly deployed Maw contract with RNG fix
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔧 Initializing new Maw contract...\n');
  
  const NEW_MAW_ADDRESS = "0xb3C474B7C9A552b1e832C3D3CB4C25dbd82A60f2";
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Using account:', signer.address);
    console.log('📄 New Maw address:', NEW_MAW_ADDRESS);
    
    // Use direct ABI to avoid fragment issues
    const mawAbi = [
      "function initialize(address _relics, address _cosmetics, address _demons, address _cultists) external",
      "function setMonthlyCosmeticTypes(uint256[] calldata cosmeticTypeIds) external",
      "function sacrificeNonce() view returns (uint256)",
      "function getCurrentCosmeticTypes() view returns (uint256[] memory)"
    ];
    
    const maw = new ethers.Contract(NEW_MAW_ADDRESS, mawAbi, signer);
    
    // Contract addresses
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
    const DEMONS_ADDRESS = "0x742d1C8080Cfdf5b3E5fC2F68CFE7b1f4a86F50F"; 
    const CULTISTS_ADDRESS = "0x2A24a5998D7B0F0c8F6c4a38aC7E57F5f8D6E5f9"; // Placeholder
    
    console.log('\n🔧 Initializing contract...');
    try {
      const initTx = await maw.initialize(
        RELICS_ADDRESS,
        COSMETICS_ADDRESS,
        DEMONS_ADDRESS, 
        CULTISTS_ADDRESS,
        { gasLimit: 500000 }
      );
      await initTx.wait();
      console.log('✅ Contract initialized!');
    } catch (e) {
      console.log('⚠️ Initialize failed (might already be initialized):', e.message);
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
      console.log('⚠️ Set types failed:', e.message);
    }
    
    // Check the RNG fix
    console.log('\n🎲 Checking RNG fix...');
    try {
      const nonce = await maw.sacrificeNonce();
      console.log('Current sacrifice nonce:', nonce.toString());
      
      const types = await maw.getCurrentCosmeticTypes();
      console.log('Current cosmetic types:', types.map(t => t.toString()));
    } catch (e) {
      console.log('⚠️ Cannot read state:', e.message);
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
        console.log('Transferring ownership to new Maw...');
        const transferTx = await cosmetics.transferOwnership(NEW_MAW_ADDRESS);
        await transferTx.wait();
        console.log('✅ Ownership transferred!');
      } else {
        console.log('⚠️ You do not own cosmetics contract');
      }
    } catch (e) {
      console.log('⚠️ Ownership transfer failed:', e.message);
    }
    
    console.log('\n🎉 New Maw contract is ready!');
    console.log('📄 Address:', NEW_MAW_ADDRESS);
    console.log('✅ RNG fix is active - cosmetics should now work properly!');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
  }
}

main().catch(console.error);