const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔧 Fixing cosmetics contract reference...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  console.log("\n📍 Current Contract Addresses:");
  console.log("MawSacrifice:", contractAddresses.MawSacrifice);
  console.log("Cosmetics (target):", contractAddresses.Cosmetics);
  console.log("Cosmetics (old):", contractAddresses.CosmeticsV2_OLD);
  
  // Get MawSacrifice contract
  const MawSacrifice = await hre.ethers.getContractAt(
    "MawSacrificeV4NoTimelock",
    contractAddresses.MawSacrifice
  );
  
  // Check current cosmetics reference
  const currentCosmeticsRef = await MawSacrifice.cosmetics();
  console.log("\n🔍 Current MawSacrifice → Cosmetics reference:", currentCosmeticsRef);
  console.log("Target cosmetics address:", contractAddresses.Cosmetics);
  
  if (currentCosmeticsRef.toLowerCase() === contractAddresses.Cosmetics.toLowerCase()) {
    console.log("✅ Cosmetics reference is already correct!");
    return;
  }
  
  console.log("\n🔧 Updating MawSacrifice cosmetics reference...");
  
  try {
    // Update cosmetics contract reference
    const tx = await MawSacrifice.setContracts(
      contractAddresses.Relics,
      contractAddresses.Cosmetics,  // Use the NEW cosmetics contract
      contractAddresses.Demons,
      contractAddresses.Cultists
    );
    
    console.log("📤 Transaction:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
    // Verify the change
    const newCosmeticsRef = await MawSacrifice.cosmetics();
    console.log("\n✅ Updated MawSacrifice → Cosmetics reference:", newCosmeticsRef);
    
    if (newCosmeticsRef.toLowerCase() === contractAddresses.Cosmetics.toLowerCase()) {
      console.log("🎉 Cosmetics reference successfully updated!");
    } else {
      console.log("⚠️ Warning: Reference may not have updated correctly");
    }
    
  } catch (error) {
    console.error("❌ Error updating cosmetics reference:", error.message);
    
    if (error.message.includes('Ownable: caller is not the owner')) {
      console.log("🔑 Note: You may need owner permissions to update contract references");
    }
  }
  
  console.log("\n✅ Fix attempt complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});