const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 Testing cosmetic sacrifice...\n");
  
  const [signer] = await ethers.getSigners();
  console.log("Testing with account:", signer.address);
  
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const cosmeticsAddress = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  // Connect to contracts using the generated ABI
  const mawABI = require('../../abis/MawSacrifice.json');
  const proxy = new ethers.Contract(proxyAddress, mawABI, signer);
  const relics = await ethers.getContractAt("Relics", relicsAddress);
  const cosmetics = await ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  
  console.log("📋 Current State:");
  
  // Check fragment balance (ID 2)
  const fragmentBalance = await relics.balanceOf(signer.address, 2);
  console.log("  Fragment balance (ID 2):", fragmentBalance.toString());
  
  // Check approval
  const isApproved = await relics.isApprovedForAll(signer.address, proxy.target);
  console.log("  Is approved:", isApproved);
  
  // Check cosmetics setup
  const cosmeticsInMaw = await proxy.cosmetics();
  console.log("  Cosmetics address in Maw:", cosmeticsInMaw);
  console.log("  Matches expected:", cosmeticsInMaw.toLowerCase() === cosmeticsAddress.toLowerCase());
  
  // Try to get cosmetics info
  try {
    const monthlySetId = await cosmetics.monthlySetId();
    console.log("  Monthly set ID:", monthlySetId.toString());
  } catch (e) {
    console.log("  ⚠️ Could not get monthly set ID");
  }
  
  // Check if MawSacrifice is authorized to mint cosmetics
  try {
    const mawInCosmetics = await cosmetics.mawSacrifice();
    console.log("  MawSacrifice in Cosmetics:", mawInCosmetics);
    console.log("  Authorization correct:", mawInCosmetics.toLowerCase() === proxyAddress.toLowerCase());
  } catch (e) {
    console.log("  ⚠️ Could not check mawSacrifice authorization on cosmetics");
  }
  
  if (fragmentBalance.toString() === "0") {
    console.log("\n❌ No fragments to sacrifice!");
    return;
  }
  
  console.log("\n🧪 Testing cosmetic sacrifice directly:");
  
  console.log("\n🧪 Testing static call first to get revert reason:");
  try {
    await proxy.sacrificeForCosmetic.staticCall(1, 0);
    console.log("  ✅ Static call would succeed");
  } catch (error) {
    console.log("  ❌ Static call failed:", error.message);
    if (error.data) {
      console.log("  📝 Error data:", error.data);
    }
    return;
  }
  
  console.log("\n🚀 Attempting cosmetic sacrifice with 1 fragment (matching frontend call):");
  try {
    // Test exactly what the frontend is calling
    const tx = await proxy.sacrificeForCosmetic(1, 0);
    console.log("  Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("  ✅ SUCCESS! Gas used:", receipt.gasUsed.toString());
    
    // Check what we got
    const newFragmentBalance = await relics.balanceOf(signer.address, 2);
    console.log("  New fragment balance:", newFragmentBalance.toString());
    console.log("  Fragments used:", (fragmentBalance - newFragmentBalance).toString());
    
  } catch (error) {
    console.log("  ❌ Error:", error.message);
    if (error.data) {
      try {
        const decoded = proxy.interface.parseError(error.data);
        console.log("  📝 Decoded error:", decoded);
      } catch (e) {
        console.log("  📝 Raw error data:", error.data);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});