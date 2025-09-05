/**
 * Simple cosmetic sacrifice test
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔥 Simple cosmetic sacrifice test...\n');
  
  const MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Using account:', signer.address);
    
    const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", MAW_ADDRESS);
    
    // Check fragment balance
    const fragmentsAddr = await maw.relics();
    const relicsAbi = [
      "function balanceOf(address account, uint256 id) view returns (uint256)",
      "function isApprovedForAll(address account, address operator) view returns (bool)",
      "function setApprovalForAll(address operator, bool approved) external"
    ];
    const fragments = new ethers.Contract(fragmentsAddr, relicsAbi, signer);
    
    const fragmentBalance = await fragments.balanceOf(signer.address, 2);
    console.log(`💎 Lantern Fragment balance: ${fragmentBalance.toString()}`);
    
    if (fragmentBalance.toString() === "0") {
      console.log('❌ No fragments to sacrifice');
      return;
    }
    
    // Check approval
    const isApproved = await fragments.isApprovedForAll(signer.address, MAW_ADDRESS);
    console.log('✅ Fragments approved:', isApproved);
    
    if (!isApproved) {
      console.log('🔐 Approving fragments...');
      const approveTx = await fragments.setApprovalForAll(MAW_ADDRESS, true);
      await approveTx.wait();
      console.log('✅ Approved!');
    }
    
    // Now try the sacrifice
    console.log('\n🔥 Attempting cosmetic sacrifice...');
    
    try {
      const tx = await maw.sacrificeForCosmetic(1, 0, {
        gasLimit: 500000
      });
      
      console.log('📝 Transaction:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed!');
      console.log('⛽ Gas used:', receipt.gasUsed.toString());
      
      // Check all logs
      console.log('\n📋 All transaction logs:');
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`  ${i}: ${log.address} - ${log.topics[0]} (${log.data.slice(0, 20)}...)`);
        
        // Look for cosmetics contract interactions
        if (log.address.toLowerCase() === COSMETICS_ADDRESS.toLowerCase()) {
          console.log('    🎨 COSMETICS INTERACTION DETECTED!');
        }
      }
      
      console.log('\n🎯 Summary:');
      console.log(`- Total logs: ${receipt.logs.length}`);
      console.log(`- Cosmetics contract logs: ${receipt.logs.filter(l => l.address.toLowerCase() === COSMETICS_ADDRESS.toLowerCase()).length}`);
      
    } catch (e) {
      console.error('❌ Sacrifice failed:', e.message);
      
      if (e.data) {
        console.log('📝 Error data:', e.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main().catch(console.error);