const hre = require("hardhat");

async function main() {
  console.log("🔍 Decoding error 0xf4d678b8...");
  
  // Common Solidity error selectors
  const errorSelectors = {
    "0x08c379a0": "Error(string)",
    "0x4e487b71": "Panic(uint256)", 
    "0xf4d678b8": "InvalidCosmeticType()", // Custom error from contract
  };
  
  const errorData = "0xf4d678b8";
  const selector = errorData.substring(0, 10);
  
  console.log("Error selector:", selector);
  console.log("Error meaning:", errorSelectors[selector] || "Unknown error");
  
  if (selector === "0xf4d678b8") {
    console.log("\n🎯 Analysis: InvalidCosmeticType() error");
    console.log("This means the cosmetic sacrifice is trying to mint a cosmetic type that doesn't exist or isn't configured properly.");
    console.log("\nPossible causes:");
    console.log("1. Cosmetic types aren't properly set up in the contract");
    console.log("2. The random cosmetic selection is picking an invalid type");
    console.log("3. The cosmetic type exists but isn't active");
  }
  
  // Let's check what cosmetic types are actually configured
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
  
  console.log("\n🔍 Checking cosmetic configuration:");
  
  try {
    const availableTypes = await MawSacrifice.getCurrentCosmeticTypes();
    console.log("MawSacrifice available types:", availableTypes.map(t => Number(t)));
    
    console.log("\nChecking each type in cosmetics contract:");
    for (const typeId of availableTypes) {
      try {
        const cosmeticInfo = await Cosmetics.getCosmeticInfo(Number(typeId));
        console.log(`  Type ${typeId}: ${cosmeticInfo[0]} (active: ${cosmeticInfo[6]})`);
      } catch (err) {
        console.log(`  Type ${typeId}: ERROR - ${err.message}`);
      }
    }
  } catch (error) {
    console.error("Error checking configuration:", error.message);
  }
  
  console.log("\n✅ Error analysis complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});