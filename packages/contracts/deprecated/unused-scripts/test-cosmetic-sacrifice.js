/**
 * Test actual cosmetic sacrifice to see what happens
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🧪 Testing actual cosmetic sacrifice...\n');
  
  const MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const FRAGMENTS_ADDRESS = "0x1Cb9e27b3C8d0Ed3b6D4b22a8B0c1e8B4A3c1234"; // Need to get this
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Using account:', signer.address);
    
    const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", MAW_ADDRESS);
    // Use direct ABI for cosmetics too
    const cosmeticsAbi = [
      "function balanceOf(address account) view returns (uint256)",
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function totalSupply() view returns (uint256)"
    ];
    const cosmetics = new ethers.Contract(COSMETICS_ADDRESS, cosmeticsAbi, signer);
    
    // Check user's current fragment balance
    console.log('💎 Checking fragment balance...');
    const fragmentsAddr = await maw.relics();
    console.log('🏺 Fragments contract:', fragmentsAddr);
    
    // Use direct ABI to avoid artifact issues
    const relicsAbi = [
      "function balanceOf(address account, uint256 id) view returns (uint256)",
      "function isApprovedForAll(address account, address operator) view returns (bool)",
      "function setApprovalForAll(address operator, bool approved) external"
    ];
    const fragments = new ethers.Contract(fragmentsAddr, relicsAbi, signer);
    const fragmentBalance = await fragments.balanceOf(signer.address, 2); // Token ID 2 = Lantern Fragment
    console.log(`💎 Lantern Fragment balance: ${fragmentBalance.toString()}`);
    
    if (fragmentBalance.toString() === "0") {
      console.log('❌ No fragments to sacrifice');
      return;
    }
    
    // Check current cosmetics balance
    const currentCosmetics = await cosmetics.balanceOf(signer.address);
    console.log(`🎨 Current cosmetics count: ${currentCosmetics.toString()}`);
    
    // Check if fragments are approved
    const isApproved = await fragments.isApprovedForAll(signer.address, MAW_ADDRESS);
    console.log('✅ Fragments approved:', isApproved);
    
    if (!isApproved) {
      console.log('🔐 Approving fragments...');
      const approveTx = await fragments.setApprovalForAll(MAW_ADDRESS, true);
      await approveTx.wait();
      console.log('✅ Approved!');
    }
    
    // Try sacrificing 1 fragment
    console.log('\n🔥 Attempting sacrifice of 1 Lantern Fragment...');
    
    try {
      // First, let's see what the success chance calculation returns
      console.log('🎲 Checking success chance...');
      
      const tx = await maw.sacrificeForCosmetic(1, 0, {
        gasLimit: 500000 // Generous gas limit
      });
      
      console.log('📝 Transaction hash:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed!');
      console.log('⛽ Gas used:', receipt.gasUsed.toString());
      
      // Check logs for events
      console.log('\n📋 Transaction events:');
      for (const log of receipt.logs) {
        try {
          if (log.address.toLowerCase() === COSMETICS_ADDRESS.toLowerCase()) {
            console.log(`🎨 Cosmetics log: ${log.topics[0]} (${log.data})`);
          } else if (log.address.toLowerCase() === fragmentsAddr.toLowerCase()) {
            console.log(`💎 Fragments log: ${log.topics[0]} (${log.data})`);
          } else if (log.address.toLowerCase() === maw.address.toLowerCase()) {
            const parsed = maw.interface.parseLog(log);
            console.log(`🤖 Maw event: ${parsed.name}`, parsed.args);
          }
        } catch (e) {
          console.log(`📝 Unparsed log from ${log.address}:`, log.topics[0]);
        }
      }
      
      // Check new cosmetics balance
      const newCosmetics = await cosmetics.balanceOf(signer.address);
      console.log(`\n🎨 Cosmetics after: ${newCosmetics.toString()}`);
      console.log(`📈 Cosmetics gained: ${newCosmetics.toString() - currentCosmetics.toString()}`);
      
    } catch (e) {
      console.error('❌ Sacrifice failed:', e.message);
      
      // Try to decode the error
      if (e.data) {
        try {
          const decoded = maw.interface.parseError(e.data);
          console.log('🔍 Decoded error:', decoded);
        } catch (decodeErr) {
          console.log('📝 Raw error data:', e.data);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main().catch(console.error);