const hre = require("hardhat");

async function main() {
  console.log('🔄 Minting test fragments...');
  
  const [signer] = await hre.ethers.getSigners();
  const userAddress = signer.address;
  console.log('User:', userAddress);
  
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
  
  try {
    // Mint 5 fragments (ID 2) for testing
    console.log('🔄 Minting 5 lantern fragments (ID 2)...');
    const tx = await relics.mint(userAddress, 2, 5, "0x");
    console.log('Transaction sent:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    console.log('✅ Fragments minted successfully');
    
    // Check balance
    const balance = await relics.balanceOf(userAddress, 2);
    console.log('New fragment balance:', balance.toString());
    
  } catch (error) {
    console.log('❌ Error minting fragments:', error.message);
    
    if (error.message.includes('Not authorized')) {
      console.log('💡 Need admin role to mint fragments directly');
      console.log('Trying alternative approach...');
      
      // Check if user has admin role
      try {
        const adminRole = await relics.DEFAULT_ADMIN_ROLE();
        const isAdmin = await relics.hasRole(adminRole, userAddress);
        console.log('User is admin:', isAdmin);
        
        if (isAdmin) {
          console.log('User should be able to mint - trying again...');
        } else {
          console.log('User is not admin - cannot mint directly');
        }
      } catch (e) {
        console.log('Error checking admin role:', e.message);
      }
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});