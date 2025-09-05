const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🔗 Authorizing new cosmetics contract...");
  console.log("User:", signer.address);
  console.log("New Cosmetics:", "0xf77AC9cd10FCeF959cF86BA489D916B0716fA279");
  console.log("New MawSacrifice Proxy:", addresses.baseSepolia.MawSacrifice);
  console.log("");

  try {
    const cosmeticsAddress = "0xf77AC9cd10FCeF959cF86BA489D916B0716fA279";
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);

    // Wait a moment for contract to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check ownership
    console.log("🔍 Checking contract state...");
    try {
      const owner = await cosmetics.owner();
      console.log("Contract owner:", owner);
      
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log("❌ We don't own this contract!");
        return;
      }
    } catch (error) {
      console.log("Note: owner() call failed, but proceeding with authorization");
    }

    // Set contracts authorization
    console.log("🔗 Setting contracts authorization...");
    const setContractsTx = await cosmetics.setContracts(
      addresses.baseSepolia.Raccoons,      // Raccoons address
      addresses.baseSepolia.MawSacrifice   // New MawSacrifice proxy
    );
    
    console.log("Authorization transaction:", setContractsTx.hash);
    await setContractsTx.wait();
    console.log("✅ Authorization complete!");
    console.log("");

    // Verify authorization
    console.log("🔍 Verifying authorization...");
    const authorizedMaw = await cosmetics.mawSacrifice();
    const authorizedRaccoons = await cosmetics.raccoons();
    
    console.log("Authorized MawSacrifice:", authorizedMaw);
    console.log("Expected MawSacrifice:", addresses.baseSepolia.MawSacrifice);
    console.log("Authorized Raccoons:", authorizedRaccoons);
    
    if (authorizedMaw.toLowerCase() === addresses.baseSepolia.MawSacrifice.toLowerCase()) {
      console.log("✅ SUCCESS! New proxy is authorized with new cosmetics!");
      console.log("");
      console.log("📋 Next steps:");
      console.log("1. Update addresses.json");
      console.log("2. Recreate cosmetic types");
      console.log("3. Test cosmetic sacrifices");
    } else {
      console.log("❌ Authorization failed!");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});