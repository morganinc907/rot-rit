const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Setting correct cosmetics address on MawSacrifice proxy...\n");
  
  const [signer] = await ethers.getSigners();
  console.log("Updating with account:", signer.address);
  
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const correctCosmeticsAddress = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  console.log("Proxy:", proxyAddress);
  console.log("Correct Cosmetics:", correctCosmeticsAddress);
  
  // Connect to proxy using V3 ABI
  const proxy = await ethers.getContractAt("MawSacrificeV3Upgradeable", proxyAddress);
  
  console.log("\n1️⃣ Checking current cosmetics address:");
  try {
    const currentCosmetics = await proxy.cosmetics();
    console.log("  Current:", currentCosmetics);
    console.log("  Needs update:", currentCosmetics.toLowerCase() !== correctCosmeticsAddress.toLowerCase());
    
    if (currentCosmetics.toLowerCase() !== correctCosmeticsAddress.toLowerCase()) {
      console.log("\n2️⃣ Updating cosmetics address...");
      const tx = await proxy.setCosmetics(correctCosmeticsAddress);
      console.log("  Transaction hash:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("  ✅ Updated! Gas used:", receipt.gasUsed.toString());
      
      // Verify the update
      const newCosmetics = await proxy.cosmetics();
      console.log("  New address:", newCosmetics);
      console.log("  Update successful:", newCosmetics.toLowerCase() === correctCosmeticsAddress.toLowerCase());
    } else {
      console.log("  ✅ Cosmetics address is already correct");
    }
    
  } catch (error) {
    console.log("  ❌ Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});