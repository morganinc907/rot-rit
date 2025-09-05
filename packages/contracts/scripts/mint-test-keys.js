const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 Minting test keys for user...");
  
  const [deployer] = await ethers.getSigners();
  const userAddress = deployer.address;
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  try {
    const relicsContract = await ethers.getContractAt("Relics", relicsAddress);
    
    // Check if user is owner of relics contract (needed to mint)
    const owner = await relicsContract.owner();
    console.log(`👑 Relics owner: ${owner}`);
    console.log(`👤 User: ${userAddress}`);
    console.log(`🤝 User is owner: ${owner.toLowerCase() === userAddress.toLowerCase()}`);
    
    if (owner.toLowerCase() === userAddress.toLowerCase()) {
      console.log("🔨 Minting 10 keys...");
      const tx = await relicsContract.mint(userAddress, 0, 10, "0x");
      const receipt = await tx.wait();
      console.log(`✅ Minted keys! Transaction: ${receipt.hash}`);
      
      // Check new balance
      const balance = await relicsContract.balanceOf(userAddress, 0);
      console.log(`🔑 New keys balance: ${balance.toString()}`);
    } else {
      console.log("❌ User is not owner, cannot mint keys directly");
      console.log("💡 Let's check if there's a mint function or other way to get keys");
      
      // Check if relics contract has a public mint function
      try {
        const mintPrice = await relicsContract.mintPrice();
        console.log(`💰 Mint price: ${ethers.formatEther(mintPrice)} ETH`);
        
        console.log("🔨 Trying public mint...");
        const tx = await relicsContract.mint(userAddress, 0, 5, "0x", {
          value: mintPrice * 5n
        });
        const receipt = await tx.wait();
        console.log(`✅ Public mint successful! Transaction: ${receipt.hash}`);
        
      } catch (mintError) {
        console.log("❌ Public mint failed:", mintError.message);
      }
    }
    
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});