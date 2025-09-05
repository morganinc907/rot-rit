const hre = require("hardhat");

async function main() {
  console.log("🔍 Simple Authorization Check...\n");

  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  const relics = await hre.ethers.getContractAt("Relics", RELICS_ADDRESS);

  try {
    const mawSacrifice = await relics.mawSacrifice();
    console.log("Relics.mawSacrifice:", mawSacrifice);
    console.log("Proxy address:", PROXY_ADDRESS);
    console.log("Match:", mawSacrifice.toLowerCase() === PROXY_ADDRESS.toLowerCase());
    
    if (mawSacrifice.toLowerCase() !== PROXY_ADDRESS.toLowerCase()) {
      console.log("\n❌ PROBLEM FOUND: Relics.mawSacrifice is not set to proxy address!");
      console.log("This is why burn/mint operations are failing.");
      console.log("The proxy cannot burn glass shards because it's not authorized.");
      
      console.log("\n🔧 SOLUTION: Run the authorize-proxy-burner.js script");
    } else {
      console.log("\n✅ Authorization is correct");
    }
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

main().catch(console.error);