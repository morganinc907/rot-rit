const hre = require("hardhat");

async function main() {
  console.log("🧪 Minimal Conversion Test...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  const relics = await hre.ethers.getContractAt("Relics", RELICS_ADDRESS);
  const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);

  // Check exact balances
  const glassShards = await relics.balanceOf(deployer.address, 8);
  console.log("Glass Shards:", glassShards.toString());
  
  if (glassShards < 5n) {
    console.log("❌ Not enough glass shards");
    return;
  }
  
  // Check all the require conditions manually
  console.log("\n🔍 Checking Requirements:");
  console.log("Amount > 0:", 5 > 0);
  console.log("Amount <= 500:", 5 <= 500);  
  console.log("Amount % 5 === 0:", 5 % 5 === 0);
  console.log("Balance >= amount:", glassShards >= 5n);
  
  // Check contract state
  const paused = await mawSacrifice.paused();
  console.log("Contract paused:", paused);
  
  // Try the simplest possible approach
  try {
    console.log("\n🧪 Attempting conversion...");
    const tx = await mawSacrifice.convertShardsToRustedCaps(5, {
      gasLimit: 300000
    });
    
    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ SUCCESS! Gas used:", receipt.gasUsed.toString());
    
    // Check new balances
    const newShards = await relics.balanceOf(deployer.address, 8);
    const newKeys = await relics.balanceOf(deployer.address, 1);
    console.log("New glass shards:", newShards.toString());
    console.log("New keys:", newKeys.toString());
    
  } catch (error) {
    console.log("❌ Failed:", error.message);
    
    // Get more error details
    if (error.data) {
      console.log("Error data:", error.data);
    }
    if (error.reason) {
      console.log("Error reason:", error.reason);
    }
    if (error.code) {
      console.log("Error code:", error.code);
    }
    
    // Try to decode revert reason
    try {
      if (error.data && error.data !== '0x') {
        // Try to decode common errors
        const iface = new hre.ethers.Interface([
          "error InvalidAmount()",
          "error InsufficientBalance()",
          "error EnforcedPause()",
          "error ReentrancyGuardReentrantCall()"
        ]);
        
        try {
          const decoded = iface.parseError(error.data);
          console.log("Decoded error:", decoded.name);
        } catch (e) {
          console.log("Could not decode error data");
        }
      }
    } catch (e) {
      // Ignore decode errors
    }
  }
}

main().catch(console.error);