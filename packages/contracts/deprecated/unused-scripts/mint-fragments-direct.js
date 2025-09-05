/**
 * Mint fragments using direct ERC1155 interface
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🧩 Minting fragments (direct ERC1155)...\n');
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  try {
    // Use ERC1155 ABI directly
    const erc1155Abi = [
      "function balanceOf(address account, uint256 id) view returns (uint256)",
      "function mint(address to, uint256 id, uint256 amount, bytes data) external",
      "function owner() view returns (address)",
      "function hasRole(bytes32 role, address account) view returns (bool)",
      "function grantRole(bytes32 role, address account) external"
    ];
    
    const [signer] = await ethers.getSigners();
    console.log('👤 Using signer:', signer.address);
    
    const relics = new ethers.Contract(RELICS_ADDRESS, erc1155Abi, signer);
    
    // Check current balance
    const currentBalance = await relics.balanceOf(USER_ADDRESS, 2);
    console.log(`💎 Current Lantern Fragment balance: ${currentBalance.toString()}`);
    
    // Check if we can mint (need to be owner or have role)
    try {
      const owner = await relics.owner();
      console.log('👑 Contract owner:', owner);
      console.log('👤 Our address:', signer.address);
      console.log('🔑 We are owner:', owner.toLowerCase() === signer.address.toLowerCase());
    } catch (e) {
      console.log('⚠️ Cannot check owner');
    }
    
    // Try to mint
    console.log('\n🔨 Attempting to mint 5 Lantern Fragments...');
    
    try {
      const tx = await relics.mint(USER_ADDRESS, 2, 5, "0x", {
        gasLimit: 200000
      });
      
      console.log('📝 Transaction:', tx.hash);
      await tx.wait();
      console.log('✅ Minted successfully!');
      
      // Check new balance
      const newBalance = await relics.balanceOf(USER_ADDRESS, 2);
      console.log(`💎 New balance: ${newBalance.toString()}`);
      console.log(`📈 Gained: ${newBalance.toString() - currentBalance.toString()}`);
      
    } catch (e) {
      console.error('❌ Mint failed:', e.message);
      
      // Try with different role check if it's a permission issue
      if (e.message.includes('Not authorized') || e.message.includes('AccessControl')) {
        console.log('\n🔍 Checking roles...');
        
        // These are the role hashes from the contract
        const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
        const KEYSHOP_ROLE = ethers.keccak256(ethers.toUtf8Bytes("KEYSHOP_ROLE"));
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        
        try {
          const hasAdmin = await relics.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
          const hasMaw = await relics.hasRole(MAW_ROLE, signer.address);
          const hasKeyshop = await relics.hasRole(KEYSHOP_ROLE, signer.address);
          
          console.log('🔐 Has DEFAULT_ADMIN_ROLE:', hasAdmin);
          console.log('🤖 Has MAW_ROLE:', hasMaw);
          console.log('🔑 Has KEYSHOP_ROLE:', hasKeyshop);
        } catch (roleErr) {
          console.log('⚠️ Cannot check roles');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

main().catch(console.error);