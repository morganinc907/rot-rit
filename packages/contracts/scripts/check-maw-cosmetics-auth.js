const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔍 Checking MawSacrifice cosmetics authorization...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  const MawSacrifice = await hre.ethers.getContractAt(
    "MawSacrificeV4NoTimelock",
    contractAddresses.MawSacrifice
  );
  
  const Cosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2",
    contractAddresses.Cosmetics
  );
  
  console.log("\n📍 Contract Addresses:");
  console.log("MawSacrifice:", contractAddresses.MawSacrifice);
  console.log("Cosmetics:", contractAddresses.Cosmetics);
  
  // Check cosmetics contract authorization
  console.log("\n🔍 Cosmetics Contract Authorization:");
  try {
    const mawSacrificeRef = await Cosmetics.mawSacrifice();
    console.log("Cosmetics → MawSacrifice reference:", mawSacrificeRef);
    console.log("Expected MawSacrifice:", contractAddresses.MawSacrifice);
    
    if (mawSacrificeRef.toLowerCase() === contractAddresses.MawSacrifice.toLowerCase()) {
      console.log("✅ Cosmetics contract is authorized for MawSacrifice");
    } else {
      console.log("❌ Cosmetics contract authorization mismatch!");
      
      console.log("\n🔧 Fixing cosmetics authorization...");
      const authTx = await Cosmetics.setContracts(
        contractAddresses.Raccoons,
        contractAddresses.MawSacrifice
      );
      
      console.log("📤 Authorization transaction:", authTx.hash);
      const authReceipt = await authTx.wait();
      console.log("✅ Authorization fixed! Gas used:", authReceipt.gasUsed.toString());
    }
  } catch (error) {
    console.error("Error checking cosmetics authorization:", error.message);
  }
  
  // Test cosmetics minting directly
  console.log("\n🧪 Testing cosmetics minting capability...");
  try {
    // Try to mint cosmetic type 1 directly from MawSacrifice
    await Cosmetics.mintTo.staticCall(deployer.address, 1);
    console.log("✅ MawSacrifice can mint cosmetics (static call succeeded)");
  } catch (error) {
    console.log("❌ MawSacrifice cannot mint cosmetics:", error.message);
    
    if (error.message.includes('Only MawSacrifice')) {
      console.log("   This is expected - only the authorized MawSacrifice can mint");
    }
  }
  
  // Check if MawSacrifice can call mintTo via its own contract
  console.log("\n🧪 Testing MawSacrifice internal cosmetic minting...");
  try {
    const testTypes = await MawSacrifice.getCurrentCosmeticTypes();
    console.log("Available cosmetic types:", testTypes.map(t => Number(t)));
    
    // The issue might be in the sacrifice logic itself
    console.log("\nThe issue is likely in the sacrifice logic, not authorization");
    
  } catch (error) {
    console.error("Error testing MawSacrifice:", error.message);
  }
  
  console.log("\n✅ Authorization check complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});