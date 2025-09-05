const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing cosmetics authorization...\n");
  
  const [signer] = await ethers.getSigners();
  console.log("Updating with account:", signer.address);
  
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const cosmeticsAddress = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  // Connect to cosmetics contract
  const cosmetics = await ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  
  console.log("📋 Current Authorization:");
  const currentMaw = await cosmetics.mawSacrifice();
  console.log("  Current MawSacrifice:", currentMaw);
  console.log("  Correct MawSacrifice:", proxyAddress);
  console.log("  Needs update:", currentMaw.toLowerCase() !== proxyAddress.toLowerCase());
  
  if (currentMaw.toLowerCase() !== proxyAddress.toLowerCase()) {
    console.log("\n🔧 Updating MawSacrifice authorization...");
    try {
      // Try setContracts function (raccoons, mawSacrifice)
      const raccoonsAddress = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f"; // From addresses package
      const tx = await cosmetics.setContracts(raccoonsAddress, proxyAddress);
      console.log("  Transaction hash:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("  ✅ Updated! Gas used:", receipt.gasUsed.toString());
      
      // Verify the update
      const newMaw = await cosmetics.mawSacrifice();
      console.log("  New MawSacrifice:", newMaw);
      console.log("  Update successful:", newMaw.toLowerCase() === proxyAddress.toLowerCase());
      
    } catch (error) {
      console.log("  ❌ Update failed:", error.message);
    }
  } else {
    console.log("  ✅ Authorization is already correct");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});