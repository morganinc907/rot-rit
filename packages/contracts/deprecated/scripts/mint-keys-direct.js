const { ethers } = require("hardhat");

async function main() {
  console.log("🗝️ Attempting to mint keys directly to Relics contract...");
  
  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  
  // Relics contract address on Base Sepolia
  const RELICS_ADDRESS = "0xCbD6AC9992A974E268bABe67C2EEc88ce88EFc84";
  
  // Relics ABI - trying different mint functions
  const RELICS_ABI = [
    "function mint(address to, uint256 id, uint256 amount) external",
    "function adminMint(address to, uint256 id, uint256 amount) external",
    "function mintBatch(address to, uint256[] ids, uint256[] amounts) external",
    "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external",
    "function balanceOf(address account, uint256 id) view returns (uint256)"
  ];
  
  const relics = new ethers.Contract(RELICS_ADDRESS, RELICS_ABI, signer);
  
  const RUSTED_KEY_ID = 1;
  const amount = 20;
  
  try {
    // First check current balance
    const currentBalance = await relics.balanceOf(signer.address, RUSTED_KEY_ID);
    console.log(`Current key balance: ${currentBalance}`);
    
    // Try adminMint first
    console.log(`Attempting to mint ${amount} keys...`);
    const tx = await relics.adminMint(signer.address, RUSTED_KEY_ID, amount);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Success! Keys minted in block:", receipt.blockNumber);
    
    // Check new balance
    const newBalance = await relics.balanceOf(signer.address, RUSTED_KEY_ID);
    console.log(`New key balance: ${newBalance}`);
    
  } catch (error) {
    console.log("❌ AdminMint failed, trying regular mint...");
    
    try {
      const tx = await relics.mint(signer.address, RUSTED_KEY_ID, amount);
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("✅ Success! Keys minted in block:", receipt.blockNumber);
      
    } catch (error2) {
      console.error("❌ Both mint attempts failed");
      console.log("\n💡 The contract likely requires admin privileges to mint.");
      console.log("You'll need to use the Key Shop to purchase keys with ETH.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });