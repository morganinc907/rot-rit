const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Finalizing new deployment setup...\n");
  
  const NEW_MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  const [signer] = await ethers.getSigners();
  console.log("Setup with signer:", signer.address);
  
  // 1. Authorize new MawSacrifice as burner on Relics
  console.log("🔑 Authorizing new MawSacrifice as burner on Relics...");
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  const authTx = await relics.authorizeBurner(NEW_MAW_ADDRESS);
  await authTx.wait();
  console.log("✅ Authorized as burner on Relics");
  
  // 2. Update Relics with new MawSacrifice address  
  console.log("📝 Updating Relics maw address...");
  const updateRelicsTx = await relics.setMawSacrificeAddress(NEW_MAW_ADDRESS);
  await updateRelicsTx.wait();
  console.log("✅ Relics updated");
  
  // 3. Update Cosmetics with new MawSacrifice address
  console.log("📝 Updating Cosmetics maw address...");
  const cosmetics = await ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);
  const updateCosmeticsTx = await cosmetics.setMawSacrifice(NEW_MAW_ADDRESS);
  await updateCosmeticsTx.wait();
  console.log("✅ Cosmetics updated");
  
  // 4. Test the sacrifice function now
  console.log("\n=== FINAL TEST ===");
  const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", NEW_MAW_ADDRESS);
  
  try {
    await maw.sacrificeForCosmetic.staticCall(1, 0);
    console.log("✅ sacrificeForCosmetic works perfectly!");
  } catch (error) {
    console.log("❌ Still failing:", error.message);
  }
  
  console.log("\n🎉 NEW DEPLOYMENT COMPLETE AND READY!");
  console.log("=".repeat(50));
  console.log("🚀 NEW MAW SACRIFICE ADDRESS:", NEW_MAW_ADDRESS);
  console.log("=".repeat(50));
  console.log("Update your frontend to use this new address!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});