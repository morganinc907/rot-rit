const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔧 Updating MawSacrifice to use NEW cosmetics contract...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  console.log("\n📍 Contract Addresses:");
  console.log("MawSacrifice:", contractAddresses.MawSacrifice);
  console.log("Current Cosmetics:", contractAddresses.Cosmetics);
  console.log("NEW Cosmetics:", contractAddresses.CosmeticsV2_NEW);
  console.log("Relics:", contractAddresses.Relics);
  console.log("Demons:", contractAddresses.Demons);
  console.log("Cultists:", contractAddresses.Cultists);
  
  // Get MawSacrifice contract
  const MawSacrifice = await hre.ethers.getContractAt(
    "MawSacrificeV4NoTimelock",
    contractAddresses.MawSacrifice
  );
  
  // Check current cosmetics reference
  const currentCosmeticsRef = await MawSacrifice.cosmetics();
  console.log("\n🔍 Current MawSacrifice → Cosmetics reference:", currentCosmeticsRef);
  console.log("Target NEW cosmetics address:", contractAddresses.CosmeticsV2_NEW);
  
  if (currentCosmeticsRef.toLowerCase() === contractAddresses.CosmeticsV2_NEW.toLowerCase()) {
    console.log("✅ MawSacrifice is already pointing to NEW cosmetics contract!");
    return;
  }
  
  console.log("\n🔧 Updating MawSacrifice to use NEW cosmetics contract...");
  
  try {
    // Update all contract references to use the NEW cosmetics contract
    const tx = await MawSacrifice.setContracts(
      contractAddresses.Relics,
      contractAddresses.CosmeticsV2_NEW,  // Use NEW cosmetics contract
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
    
    if (newCosmeticsRef.toLowerCase() === contractAddresses.CosmeticsV2_NEW.toLowerCase()) {
      console.log("🎉 MawSacrifice successfully updated to use NEW cosmetics contract!");
      
      // Now update the NEW cosmetics contract to authorize MawSacrifice
      console.log("\n🔧 Authorizing MawSacrifice on NEW cosmetics contract...");
      
      const NewCosmetics = await hre.ethers.getContractAt(
        "CosmeticsV2",
        contractAddresses.CosmeticsV2_NEW
      );
      
      const authTx = await NewCosmetics.setContracts(
        contractAddresses.Raccoons,
        contractAddresses.MawSacrifice
      );
      
      console.log("📤 Authorization transaction:", authTx.hash);
      const authReceipt = await authTx.wait();
      console.log("✅ Authorization confirmed! Gas used:", authReceipt.gasUsed.toString());
      
    } else {
      console.log("⚠️ Warning: Reference may not have updated correctly");
    }
    
  } catch (error) {
    console.error("❌ Error updating cosmetics reference:", error.message);
    
    if (error.message.includes('Ownable: caller is not the owner')) {
      console.log("🔑 Note: You may need owner permissions to update contract references");
    }
  }
  
  console.log("\n✅ Update attempt complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});