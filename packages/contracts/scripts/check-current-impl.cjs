const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking current implementation...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  
  // Get implementation slot
  const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  
  const implAddress = await ethers.provider.getStorage(PROXY_ADDRESS, IMPLEMENTATION_SLOT);
  const cleanImplAddress = "0x" + implAddress.slice(-40);
  
  console.log("Current implementation:", cleanImplAddress);
  console.log("Expected new implementation: 0xd6891aB0fbCc72ff97fd185E2F525f6DaeA839B2");
  
  if (cleanImplAddress.toLowerCase() === "0xd6891aB0fbCc72ff97fd185E2F525f6DaeA839B2".toLowerCase()) {
    console.log("✅ Implementation was updated");
    
    // Get the implementation code and check if it has our fix
    const code = await ethers.provider.getCode(cleanImplAddress);
    const codeHash = ethers.utils.keccak256(code);
    console.log("Implementation code hash:", codeHash);
    
  } else {
    console.log("❌ Implementation was not updated");
    console.log("Something went wrong with the upgrade");
  }
  
  // Also try to manually call canMintCaps to see what's happening
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  console.log("\n🧪 Testing canMintCaps directly...");
  try {
    const result = await maw.canMintCaps(1);
    console.log("canMintCaps(1):", result);
  } catch (error) {
    console.log("❌ canMintCaps failed:", error.message);
  }
}

main().catch(console.error);