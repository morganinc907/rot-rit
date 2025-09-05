/**
 * Mint fragments specifically for testing cosmetic sacrifices
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🧩 Minting fragments for cosmetic testing...\n');
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  const FRAGMENT_ID = 2;
  const AMOUNT = 10;
  
  console.log('📄 Relics:', RELICS_ADDRESS);
  console.log('👤 User:', USER_ADDRESS);
  console.log('🧩 Fragment ID:', FRAGMENT_ID);
  console.log('📦 Amount to mint:', AMOUNT);
  
  try {
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    // Check current balance
    const currentBalance = await relics.balanceOf(USER_ADDRESS, FRAGMENT_ID);
    console.log('📊 Current fragment balance:', currentBalance.toString());
    
    // Mint fragments
    console.log('\n🔨 Minting fragments...');
    const tx = await relics.mint(USER_ADDRESS, FRAGMENT_ID, AMOUNT, "0x");
    console.log('📝 Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    console.log('✅ Minting confirmed!');
    
    // Verify new balance
    const newBalance = await relics.balanceOf(USER_ADDRESS, FRAGMENT_ID);
    console.log('📊 New fragment balance:', newBalance.toString());
    console.log(`✅ Successfully minted ${newBalance.toString() - currentBalance.toString()} fragments!`);
    
  } catch (error) {
    console.error('❌ Minting failed:', error.message);
    
    if (error.message.includes('replacement transaction underpriced')) {
      console.log('💡 Try again in a few seconds when gas prices settle');
    }
  }
}

main().catch(console.error);