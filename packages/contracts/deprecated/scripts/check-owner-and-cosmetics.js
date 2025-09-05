const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking contract owner and cosmetic setup...\n");
  
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const [signer] = await ethers.getSigners();
  
  const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", proxyAddress);
  
  console.log("Current signer:", signer.address);
  
  try {
    // Check who the owner is
    const owner = await proxy.owner();
    console.log("Contract owner:", owner);
    console.log("Is signer the owner?", owner.toLowerCase() === signer.address.toLowerCase());
    
    // Check current cosmetic types
    const currentTypes = await proxy.getCurrentCosmeticTypes();
    console.log("Current cosmetic types:", currentTypes.map(t => t.toString()));
    
    // Check the monthly set ID
    const setId = await proxy.currentMonthlySetId();
    console.log("Current monthly set ID:", setId.toString());
    
    // Try a static call to see if it would work
    console.log("\n=== TESTING setMonthlyCosmeticTypes ===");
    try {
      await proxy.setMonthlyCosmeticTypes.staticCall([1, 2, 3]);
      console.log("✅ setMonthlyCosmeticTypes static call succeeded");
    } catch (error) {
      console.log("❌ setMonthlyCosmeticTypes static call failed:", error.message);
      
      if (error.message.includes("Ownable")) {
        console.log("🔑 This is an ownership issue - signer is not the owner");
      }
    }
    
    // If we're not the owner, let's see if we can find who is
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("\n🚨 OWNER MISMATCH DETECTED");
      console.log("We need to either:");
      console.log("1. Use the correct owner account");
      console.log("2. Transfer ownership to current signer");
      console.log("3. Use a different admin method if available");
    }
    
  } catch (error) {
    console.error("Error during checks:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});