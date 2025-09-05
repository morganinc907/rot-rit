const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Testing direct conversion bypass...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);
  
  if (signer.address.toLowerCase() !== USER_ADDRESS.toLowerCase()) {
    console.log("❌ Signer doesn't match user address");
    return;
  }
  
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Check current balances
  const shardBalance = await relics.balanceOf(USER_ADDRESS, 6);
  const capBalance = await relics.balanceOf(USER_ADDRESS, 0);
  console.log(`Before - Shards: ${shardBalance}, Caps: ${capBalance}`);
  
  if (shardBalance < 5) {
    console.log("❌ Insufficient shards for conversion (need 5)");
    return;
  }
  
  // Attempt the conversion
  try {
    console.log("🧪 Attempting conversion of 5 shards to 1 cap...");
    const tx = await maw.convertShardsToRustedCaps(5, {
      gasLimit: 500000 // Set a reasonable gas limit
    });
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction succeeded!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check new balances
    const newShardBalance = await relics.balanceOf(USER_ADDRESS, 6);
    const newCapBalance = await relics.balanceOf(USER_ADDRESS, 0);
    console.log(`After - Shards: ${newShardBalance}, Caps: ${newCapBalance}`);
    
  } catch (error) {
    console.log("❌ Transaction failed:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
    
    // Decode common errors
    if (error.message.includes("CapsSoldOutOrDisallowed")) {
      console.log("🎯 This is the canMintCaps bug - the function incorrectly tests user permissions instead of contract permissions");
    }
  }
}

main().catch(console.error);