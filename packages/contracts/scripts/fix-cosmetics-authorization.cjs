const hre = require("hardhat");

async function main() {
  console.log('🔧 Fixing cosmetics authorization...');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('Signer:', signer.address);
  
  const cosmeticsAddress = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  
  // Check current maw sacrifice address
  try {
    const currentMaw = await cosmetics.mawSacrifice();
    console.log('Current MAW address in cosmetics:', currentMaw);
    
    if (currentMaw.toLowerCase() === mawAddress.toLowerCase()) {
      console.log('✅ MAW address is already correct');
      return;
    }
    
    console.log('❌ MAW address mismatch, updating...');
    
    // Update MAW address in cosmetics contract
    console.log(`🔄 Setting MAW address to ${mawAddress}...`);
    const tx = await cosmetics.setMawSacrifice(mawAddress);
    console.log('Transaction sent:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    console.log('✅ MAW address updated in cosmetics contract');
    
    // Verify the update
    const newMaw = await cosmetics.mawSacrifice();
    console.log('New MAW address in cosmetics:', newMaw);
    
  } catch (error) {
    console.log('❌ Error fixing cosmetics authorization:', error.message);
    
    if (error.message.includes('not the owner')) {
      console.log('💡 Only the owner can set the MAW address');
      console.log('Current owner:', await cosmetics.owner());
      console.log('Signer:', signer.address);
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});