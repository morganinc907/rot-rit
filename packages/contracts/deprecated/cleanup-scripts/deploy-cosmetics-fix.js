const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🔧 Deploying cosmetics fix for old V4 contract...");
  console.log("Deploying from:", signer.address);
  console.log("Old V4 contract:", "0x09cB2813f07105385f76E5917C3b68c980a91E73");
  console.log("");

  try {
    // Deploy the fix contract
    console.log("🚀 Deploying MawSacrificeV4CosmeticsFix...");
    const MawSacrificeV4CosmeticsFix = await hre.ethers.getContractFactory("MawSacrificeV4CosmeticsFix");
    const fixContract = await MawSacrificeV4CosmeticsFix.deploy();
    await fixContract.waitForDeployment();
    
    const fixAddress = await fixContract.getAddress();
    console.log("✅ MawSacrificeV4CosmeticsFix deployed to:", fixAddress);
    console.log("");

    // Now upgrade the old V4 contract to this new implementation
    console.log("🔄 Upgrading old V4 contract to include fix functions...");
    const oldV4Address = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
    const oldV4 = await hre.ethers.getContractAt("MawSacrificeV4Upgradeable", oldV4Address);
    
    const upgradeTx = await oldV4.upgradeToAndCall(fixAddress, "0x");
    console.log("Upgrade transaction:", upgradeTx.hash);
    await upgradeTx.wait();
    console.log("✅ Old V4 contract upgraded!");
    console.log("");

    // Now use the fix functions
    console.log("🔧 Using fix functions to update cosmetics authorization...");
    const fixedContract = await hre.ethers.getContractAt("MawSacrificeV4CosmeticsFix", oldV4Address);
    
    // Step 1: Update cosmetics authorization to point to new proxy
    console.log("Step 1: Updating cosmetics authorization...");
    const updateTx = await fixedContract.updateCosmeticsAuth(
      addresses.baseSepolia.Raccoons,
      addresses.baseSepolia.MawSacrifice  // New proxy
    );
    console.log("Update transaction:", updateTx.hash);
    await updateTx.wait();
    console.log("✅ Cosmetics authorization updated!");
    
    // Verify the fix
    console.log("");
    console.log("🔍 Verifying the fix...");
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", addresses.baseSepolia.Cosmetics);
    const newAuth = await cosmetics.mawSacrifice();
    console.log("New mawSacrifice authorization:", newAuth);
    
    if (newAuth.toLowerCase() === addresses.baseSepolia.MawSacrifice.toLowerCase()) {
      console.log("✅ SUCCESS! New proxy is now authorized for cosmetics!");
      console.log("✅ Cosmetic sacrifices should now work properly!");
    } else {
      console.log("❌ Authorization update failed");
      console.log("Expected:", addresses.baseSepolia.MawSacrifice);
      console.log("Got:", newAuth);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});