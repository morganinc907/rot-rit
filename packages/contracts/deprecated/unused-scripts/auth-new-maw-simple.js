const { ethers } = require("hardhat");
const path = require("path");
const fs = require("fs");

// Load addresses from the generated package
const addressesPath = path.resolve(__dirname, "../../addresses/addresses.json");
const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
const { baseSepolia } = addresses;

async function main() {
  console.log("🔧 Simple authorization for new MawSacrifice...\n");

  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);

  // Use generated addresses instead of hardcoded ones
  const NEW_MAW_ADDRESS = baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = baseSepolia.Relics;
  const COSMETICS_ADDRESS = baseSepolia.Cosmetics;
  const RACCOONS_ADDRESS = baseSepolia.Raccoons;
  
  console.log("New MawSacrifice:", NEW_MAW_ADDRESS);
  console.log("Relics:", RELICS_ADDRESS);
  
  // Connect to contracts
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  const cosmetics = await ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);
  const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", NEW_MAW_ADDRESS);

  // 1. Authorize in Relics using setMawSacrifice
  console.log("\n🔧 Setting MawSacrifice address in Relics...");
  try {
    const tx1 = await relics.setMawSacrifice(NEW_MAW_ADDRESS);
    await tx1.wait();
    console.log("✅ Done");
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  // 2. Set in Cosmetics using setContracts
  console.log("🎨 Setting MawSacrifice in Cosmetics...");
  try {
    const tx2 = await cosmetics.setContracts(RACCOONS_ADDRESS, NEW_MAW_ADDRESS);
    await tx2.wait();
    console.log("✅ Done");
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  // 3. Final test
  console.log("\n🧪 Final test...");
  try {
    await maw.sacrificeForCosmetic.staticCall(1, 0);
    console.log("✅ IT WORKS! sacrificeForCosmetic is ready!");
  } catch (error) {
    console.log("❌ Still failing:", error.message);
  }

  console.log("\n🎉 NEW CONTRACT READY!");
  console.log("Address:", NEW_MAW_ADDRESS);
}

main().catch(console.error);