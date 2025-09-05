const hre = require("hardhat");
require("dotenv").config();

const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Debug minting...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  // Check all the requirements
  console.log("=== Pre-mint Checks ===");
  const mintingEnabled = await raccoons.mintingEnabled();
  const maxSupply = await raccoons.MAX_SUPPLY();
  const totalMinted = await raccoons.totalMinted();
  const mintPrice = await raccoons.mintPrice();
  const maxPerTx = await raccoons.maxPerTx();
  
  console.log("Minting enabled:", mintingEnabled);
  console.log("Max supply:", maxSupply.toString());
  console.log("Total minted:", totalMinted.toString());
  console.log("Mint price:", hre.ethers.formatEther(mintPrice));
  console.log("Max per tx:", maxPerTx.toString());
  console.log("Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));
  
  // Try to mint 1 token with detailed error checking
  console.log("\n=== Attempting to mint 1 token ===");
  try {
    // First check if we would exceed supply
    if (totalMinted + 1n > maxSupply) {
      console.log("❌ Would exceed max supply");
      return;
    }
    
    // Check payment
    if (mintPrice > 0n) {
      console.log("Payment required:", hre.ethers.formatEther(mintPrice));
    }
    
    console.log("Calling mint(1)...");
    const tx = await raccoons.mint(1, { 
      value: mintPrice,
      gasLimit: 200000
    });
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check events
    console.log("Events emitted:", receipt.logs.length);
    for (let i = 0; i < receipt.logs.length; i++) {
      try {
        const parsed = raccoons.interface.parseLog(receipt.logs[i]);
        console.log(`Event ${i}:`, parsed.name, parsed.args);
      } catch (e) {
        console.log(`Event ${i}: Unable to parse`);
      }
    }
    
    // Check final state
    const finalTotal = await raccoons.totalMinted();
    console.log("Final total minted:", finalTotal.toString());
    
  } catch (error) {
    console.log("❌ Mint failed:");
    console.log("Error message:", error.message);
    console.log("Error reason:", error.reason);
    
    // Try to get more specific error info
    if (error.data) {
      console.log("Error data:", error.data);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});