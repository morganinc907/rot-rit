const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Final system check - all contracts should point to proxy...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const networkAddresses = addresses.baseSepolia;
  
  console.log("Expected MawSacrifice proxy:", PROXY_ADDRESS);
  
  try {
    // Check Relics
    const relics = await ethers.getContractAt("Relics", networkAddresses.Relics);
    const relicsMaw = await relics.mawSacrifice();
    console.log("\nRelics contract:");
    console.log("- Stored mawSacrifice:", relicsMaw);
    console.log("- Matches proxy:", relicsMaw.toLowerCase() === PROXY_ADDRESS.toLowerCase());
    
    // Check Cosmetics
    const cosmetics = await ethers.getContractAt("CosmeticsV2", networkAddresses.Cosmetics);
    const cosmeticsMaw = await cosmetics.mawSacrifice();
    console.log("\nCosmetics contract:");
    console.log("- Stored mawSacrifice:", cosmeticsMaw);
    console.log("- Matches proxy:", cosmeticsMaw.toLowerCase() === PROXY_ADDRESS.toLowerCase());
    
    // If cosmetics doesnt match, fix it
    if (cosmeticsMaw.toLowerCase() !== PROXY_ADDRESS.toLowerCase()) {
      console.log("\n🔧 Fixing Cosmetics authorization...");
      const tx = await cosmetics.setContracts(networkAddresses.Raccoons, PROXY_ADDRESS);
      await tx.wait();
      console.log("✅ Fixed Cosmetics:", tx.hash);
    }
    
    // Test both sacrifices
    console.log("\n🧪 Testing sacrifices:");
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    const [signer] = await ethers.getSigners();
    
    const keyBalance = await relics.balanceOf(signer.address, 1);
    const fragmentBalance = await relics.balanceOf(signer.address, 2);
    
    console.log("Balances - Keys:", keyBalance.toString(), "Fragments:", fragmentBalance.toString());
    
    if (keyBalance > 0) {
      try {
        const tx1 = await maw.sacrificeKeys(1);
        await tx1.wait();
        console.log("✅ sacrificeKeys SUCCESS:", tx1.hash);
      } catch (e) {
        console.log("❌ sacrificeKeys failed:", e.message);
      }
    }
    
    if (fragmentBalance > 0) {
      try {
        const tx2 = await maw.sacrificeForCosmetic(1, 0);
        await tx2.wait();
        console.log("✅ sacrificeForCosmetic SUCCESS:", tx2.hash);
      } catch (e) {
        console.log("❌ sacrificeForCosmetic failed:", e.message);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
