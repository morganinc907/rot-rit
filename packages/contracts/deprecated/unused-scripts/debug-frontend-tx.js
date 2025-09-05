const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging frontend transaction...\n");
  
  const NEW_MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const [signer] = await ethers.getSigners();
  
  const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", NEW_MAW_ADDRESS);
  
  // Simulate the exact transaction the frontend is sending
  // From your error: data: 0x0cce1e9300000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000
  // This is sacrificeForCosmetic(2, 0)
  
  console.log("🧪 Testing sacrificeForCosmetic(2, 0) - exact frontend call...");
  
  try {
    // First try static call
    await maw.sacrificeForCosmetic.staticCall(2, 0);
    console.log("✅ Static call works");
    
    // Now try actual transaction with same gas settings as frontend
    const tx = await maw.sacrificeForCosmetic(2, 0, {
      gasLimit: 76742, // Same as frontend attempted
    });
    
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction succeeded!");
    
  } catch (error) {
    console.log("❌ Transaction failed:", error.message);
    
    // Check if it's a gas issue
    try {
      console.log("🔧 Trying with more gas...");
      const tx = await maw.sacrificeForCosmetic(2, 0, {
        gasLimit: 500000,
      });
      
      await tx.wait();
      console.log("✅ Works with more gas! Gas estimation issue.");
      
    } catch (error2) {
      console.log("❌ Still fails with more gas:", error2.message);
      
      // Check user's current state
      const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
      const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
      
      const fragmentBalance = await relics.balanceOf(signer.address, 2);
      const isApproved = await relics.isApprovedForAll(signer.address, NEW_MAW_ADDRESS);
      const lastBlock = await maw.lastSacrificeBlock(signer.address);
      const currentBlock = await ethers.provider.getBlockNumber();
      
      console.log("\n📋 Current State:");
      console.log("   Fragment balance:", fragmentBalance.toString());
      console.log("   Approved:", isApproved);
      console.log("   Blocks since last sacrifice:", currentBlock - Number(lastBlock));
    }
  }
}

main().catch(console.error);