const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking Relics Contract Permissions...\n");

  const [deployer] = await hre.ethers.getSigners();
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  const relics = await hre.ethers.getContractAt("Relics", RELICS_ADDRESS);

  try {
    console.log("📋 Current Settings:");
    const mawSacrifice = await relics.mawSacrifice();
    const burner = await relics.burner();
    
    console.log("Relics.mawSacrifice:", mawSacrifice);
    console.log("Expected (proxy):", PROXY_ADDRESS);
    console.log("Match:", mawSacrifice.toLowerCase() === PROXY_ADDRESS.toLowerCase());
    
    console.log("Relics.burner:", burner);
    console.log("Burner matches proxy:", burner.toLowerCase() === PROXY_ADDRESS.toLowerCase());
    
    // Check user's glass shard balance
    const glassShards = await relics.balanceOf(deployer.address, 8);
    console.log("\nUser glass shards:", glassShards.toString());
    
    // Test if we can burn directly (should fail if not burner)
    console.log("\n🧪 Testing Burn Permission...");
    try {
      // This should fail if proxy doesn't have burn rights
      await relics.burn.staticCall(deployer.address, 8, 5);
      console.log("✅ Proxy CAN burn tokens");
    } catch (error) {
      console.log("❌ Proxy CANNOT burn tokens:", error.message);
      
      // Check who has burn permission
      console.log("\n🔍 Checking Burn Authorization...");
      const proxyCanBurn = await relics.isAuthorized(PROXY_ADDRESS);
      console.log("Proxy is authorized to burn:", proxyCanBurn);
    }
    
    // Test mint permission too
    console.log("\n🧪 Testing Mint Permission...");
    try {
      await relics.mint.staticCall(deployer.address, 1, 1);
      console.log("✅ Proxy CAN mint tokens");
    } catch (error) {
      console.log("❌ Proxy CANNOT mint tokens:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Permission check failed:", error.message);
  }
}

main().catch(console.error);