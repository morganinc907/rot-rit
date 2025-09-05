const { ethers } = require("hardhat");

async function main() {
  console.log("🗝️ Minting test keys...");
  
  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  
  // KeyShop contract address on Base Sepolia
  const KEYSHOP_ADDRESS = "0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6";
  
  // KeyShop ABI - just the mint function we need
  const KEYSHOP_ABI = [
    "function devMint(address to, uint256 amount) external"
  ];
  
  // Connect to the contract
  const keyShop = new ethers.Contract(KEYSHOP_ADDRESS, KEYSHOP_ABI, signer);
  
  // Mint 20 keys to your wallet
  const recipientAddress = signer.address; // Will mint to the wallet running the script
  const amount = 20;
  
  console.log(`Minting ${amount} keys to ${recipientAddress}...`);
  
  try {
    const tx = await keyShop.devMint(recipientAddress, amount);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Success! Keys minted in block:", receipt.blockNumber);
    console.log(`You now have ${amount} more keys!`);
  } catch (error) {
    console.error("❌ Error minting keys:", error);
    
    // If devMint doesn't work, try the public mint function (costs ETH)
    console.log("\n📝 Note: If devMint failed, the contract might not have a dev mint function.");
    console.log("You may need to use the Key Shop to purchase keys with ETH.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });