const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🎨 Deploying NEW CosmeticsV2 contract...");
  console.log("Deployer (will be owner):", signer.address);
  console.log("New MawSacrifice Proxy:", addresses.baseSepolia.MawSacrifice);
  console.log("");

  try {
    // Deploy new CosmeticsV2 contract
    console.log("🚀 Deploying CosmeticsV2...");
    const CosmeticsV2 = await hre.ethers.getContractFactory("CosmeticsV2");
    const cosmetics = await CosmeticsV2.deploy(
      "https://rot-ritual.s3.amazonaws.com/cosmetics/", // baseTypeURI
      "https://rot-ritual.s3.amazonaws.com/cosmetics/"  // boundBaseURI
    );
    await cosmetics.waitForDeployment();
    
    const cosmeticsAddress = await cosmetics.getAddress();
    console.log("✅ NEW CosmeticsV2 deployed to:", cosmeticsAddress);
    console.log("");

    // Verify ownership
    const owner = await cosmetics.owner();
    console.log("Contract owner:", owner);
    console.log("Expected owner:", signer.address);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("❌ Ownership mismatch!");
      return;
    }
    console.log("✅ Ownership verified!");
    console.log("");

    // Authorize new MawSacrifice proxy
    console.log("🔗 Setting contracts authorization...");
    console.log("- Raccoons:", addresses.baseSepolia.Raccoons);
    console.log("- MawSacrifice:", addresses.baseSepolia.MawSacrifice);
    
    const setContractsTx = await cosmetics.setContracts(
      addresses.baseSepolia.Raccoons,
      addresses.baseSepolia.MawSacrifice
    );
    console.log("Authorization transaction:", setContractsTx.hash);
    await setContractsTx.wait();
    console.log("✅ Authorization complete!");
    console.log("");

    // Verify authorization
    const authorizedMaw = await cosmetics.mawSacrifice();
    const authorizedRaccoons = await cosmetics.raccoons();
    console.log("🔍 Verification:");
    console.log("- Authorized MawSacrifice:", authorizedMaw);
    console.log("- Authorized Raccoons:", authorizedRaccoons);
    
    if (authorizedMaw.toLowerCase() === addresses.baseSepolia.MawSacrifice.toLowerCase()) {
      console.log("✅ MawSacrifice authorization SUCCESS!");
    } else {
      console.log("❌ MawSacrifice authorization FAILED!");
    }
    
    console.log("");
    console.log("📋 NEXT STEPS:");
    console.log("1. Update addresses.json with new cosmetics address:", cosmeticsAddress);
    console.log("2. Recreate cosmetic types on new contract");
    console.log("3. Update frontend to use new cosmetics contract");
    console.log("4. Test cosmetic sacrifices");
    console.log("");
    console.log("🎯 NEW COSMETICS ADDRESS:", cosmeticsAddress);
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});