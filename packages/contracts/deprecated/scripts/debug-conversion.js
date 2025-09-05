const hre = require("hardhat");

async function main() {
  console.log("🔍 Debug Glass Shard Conversion...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Account:", deployer.address);

  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  const relics = await hre.ethers.getContractAt("Relics", RELICS_ADDRESS);
  const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);

  try {
    // Check balances
    const glassShards = await relics.balanceOf(deployer.address, 8); // Glass Shards (ASHES)
    console.log("Glass Shards (ID 8):", glassShards.toString());
    
    // Check constants
    const ASHES_ID = await mawSacrifice.ASHES();
    console.log("ASHES constant:", ASHES_ID.toString());
    
    if (glassShards >= 5n) {
      console.log("\n🧪 Testing conversion with static call first...");
      
      // Try static call to see the revert reason
      try {
        await mawSacrifice.convertShardsToRustedCaps.staticCall(5n);
        console.log("✅ Static call succeeded - transaction should work");
      } catch (error) {
        console.log("❌ Static call failed:", error.message);
        if (error.reason) console.log("Reason:", error.reason);
        if (error.data) console.log("Data:", error.data);
        
        // Try to decode the error
        try {
          const errorInterface = new hre.ethers.Interface([
            "error InvalidAmount()",
            "error InsufficientBalance()",
            "error Paused()", 
            "error ReentrancyGuard()",
            "error NotAuthorized()"
          ]);
          if (error.data) {
            const decoded = errorInterface.parseError(error.data);
            console.log("Decoded error:", decoded.name);
          }
        } catch (decodeError) {
          console.log("Could not decode error");
        }
      }
      
      // Check contract state
      console.log("\n📋 Contract State:");
      const paused = await mawSacrifice.paused();
      console.log("Paused:", paused);
      
      // Check authorization 
      const mawAddress = await relics.mawSacrifice();
      console.log("Relics.mawSacrifice:", mawAddress);
      console.log("Expected (proxy):", PROXY_ADDRESS);
      console.log("Authorization match:", mawAddress.toLowerCase() === PROXY_ADDRESS.toLowerCase());
      
    } else {
      console.log("❌ Insufficient Glass Shards for testing (need at least 5)");
    }

  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

main().catch(console.error);