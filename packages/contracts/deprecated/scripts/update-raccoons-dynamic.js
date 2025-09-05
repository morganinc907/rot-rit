const hre = require("hardhat");

async function main() {
  console.log("🔄 Updating Raccoons contract with dynamic metadata support...");
  
  // Current contract address
  const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
  const COSMETICS_ADDRESS = "0x0De59eF75dDf2D7c6310f5F8c84bb52e6E0873B3";
  
  // Get the contract
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);
  
  try {
    // Set the dynamic metadata URI (will be updated when service is deployed)
    const DYNAMIC_METADATA_URI = "https://your-metadata-service.com"; // Placeholder
    
    console.log(`📝 Setting dynamic metadata URI to: ${DYNAMIC_METADATA_URI}`);
    const tx1 = await raccoons.setDynamicMetadataURI(DYNAMIC_METADATA_URI);
    await tx1.wait();
    console.log("✅ Dynamic metadata URI set");
    
    // Ensure cosmetics contract is set
    console.log(`🎨 Setting cosmetics contract to: ${COSMETICS_ADDRESS}`);
    const tx2 = await raccoons.setCosmeticsContract(COSMETICS_ADDRESS);
    await tx2.wait();
    console.log("✅ Cosmetics contract set");
    
    // Test the dynamic functionality
    console.log("\n🧪 Testing dynamic metadata functionality...");
    
    // Check if raccoon #1 has cosmetics
    const hasCosmetics = await raccoons.hasCosmetics(1);
    console.log(`Raccoon #1 has cosmetics: ${hasCosmetics}`);
    
    // Get tokenURI for raccoon #1
    const tokenURI = await raccoons.tokenURI(1);
    console.log(`Raccoon #1 tokenURI: ${tokenURI}`);
    
    console.log("\n✅ Raccoons contract updated successfully!");
    console.log("\n🔗 Contract functions:");
    console.log("- setDynamicMetadataURI(string): Set the base URL for dynamic metadata service");
    console.log("- hasCosmetics(uint256): Check if a raccoon has equipped cosmetics");
    console.log("- tokenURI(uint256): Get dynamic or static metadata URI");
    
  } catch (error) {
    console.error("❌ Error updating contract:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });