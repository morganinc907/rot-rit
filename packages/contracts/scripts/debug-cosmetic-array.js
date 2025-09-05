const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔍 Debugging cosmetic types array...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  const MawSacrifice = await hre.ethers.getContractAt(
    "MawSacrificeV4NoTimelock",
    contractAddresses.MawSacrifice
  );
  
  console.log("\n🔍 Checking array access methods:");
  
  // Try different ways to access the array
  try {
    console.log("Method 1: getCurrentCosmeticTypes()");
    const method1 = await MawSacrifice.getCurrentCosmeticTypes();
    console.log("Result:", method1.map(t => Number(t)));
  } catch (error) {
    console.log("Error:", error.message);
  }
  
  try {
    console.log("\nMethod 2: currentCosmeticTypes.length");
    const length = await MawSacrifice.currentCosmeticTypes.length;
    console.log("Length:", length.toString());
  } catch (error) {
    console.log("Error:", error.message);
  }
  
  try {
    console.log("\nMethod 3: Direct array access currentCosmeticTypes(0)");
    const element0 = await MawSacrifice.currentCosmeticTypes(0);
    console.log("Element 0:", element0.toString());
  } catch (error) {
    console.log("Error:", error.message);
  }
  
  try {
    console.log("\nMethod 4: Call data simulation");
    // Simulate what happens in _rollCosmeticType
    const currentTypes = await MawSacrifice.getCurrentCosmeticTypes();
    if (currentTypes.length === 0) {
      console.log("The array returned by getCurrentCosmeticTypes() is empty");
      console.log("This would cause _rollCosmeticType to return 1 (default)");
    } else {
      console.log("Array has", currentTypes.length, "elements");
      console.log("_rollCosmeticType would select from:", currentTypes.map(t => Number(t)));
    }
  } catch (error) {
    console.log("Error:", error.message);
  }
  
  // Let's look at the contract source more carefully
  console.log("\n🔍 The issue might be with the contract implementation");
  console.log("Let me check if there are multiple cosmetic type arrays or functions");
  
  // Test the sacrifice function again to see what specific error we get
  console.log("\n🧪 Testing sacrifice function to see exact error:");
  try {
    await MawSacrifice.sacrificeForCosmetic.staticCall(1, 0);
    console.log("✅ Static call succeeded!");
  } catch (error) {
    console.log("❌ Static call failed:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
    
    // Check if this is still the InvalidCosmeticType error
    if (error.data === "0xf4d678b8") {
      console.log("Still getting InvalidCosmeticType() error");
      console.log("The currentCosmeticTypes array is likely still empty or not working correctly");
    }
  }
  
  console.log("\n✅ Debug complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});