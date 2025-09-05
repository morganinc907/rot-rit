const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔧 Finishing MawSacrifice setup...\n");

  const [deployer] = await ethers.getSigners();
  
  // Load updated addresses
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  console.log("New MawSacrifice:", addresses.mawSacrifice);
  
  // Connect to contracts
  const maw = await ethers.getContractAt("MawSacrifice", addresses.mawSacrifice);
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  const cosmetics = await ethers.getContractAt("Cosmetics", addresses.cosmetics);
  const demons = await ethers.getContractAt("Demons", addresses.demons);
  const cultists = await ethers.getContractAt("Cultists", addresses.cultists);
  
  console.log("⚙️ Configuring MawSacrifice settings...");
  try {
    await (await maw.setMinBlocksBetweenSacrifices(1, { gasPrice: ethers.parseUnits("3", "gwei") })).wait();
    console.log("✅ Min blocks set");
    
    await (await maw.setAshesPerVial(25, { gasPrice: ethers.parseUnits("3", "gwei") })).wait();
    console.log("✅ Ashes per vial set to 25");
  } catch (error) {
    console.log("⚠️ Configuration error (might already be set):", error.message);
  }
  
  console.log("\n🔗 Authorizing new MawSacrifice in other contracts...");
  
  // Authorize MawSacrifice in Relics
  try {
    await (await relics.setMawSacrifice(addresses.mawSacrifice, { gasPrice: ethers.parseUnits("3", "gwei") })).wait();
    console.log("✅ MawSacrifice authorized in Relics");
  } catch (error) {
    console.log("⚠️ Relics authorization error:", error.message);
  }
  
  // Authorize MawSacrifice in Cosmetics
  try {
    await (await cosmetics.setMawSacrifice(addresses.mawSacrifice, { gasPrice: ethers.parseUnits("3", "gwei") })).wait();
    console.log("✅ MawSacrifice authorized in Cosmetics");
  } catch (error) {
    console.log("⚠️ Cosmetics authorization error:", error.message);
  }
  
  // Authorize MawSacrifice in Demons
  try {
    await (await demons.setMawSacrifice(addresses.mawSacrifice, { gasPrice: ethers.parseUnits("3", "gwei") })).wait();
    console.log("✅ MawSacrifice authorized in Demons");
  } catch (error) {
    console.log("⚠️ Demons authorization error:", error.message);
  }
  
  // Authorize MawSacrifice in Cultists
  try {
    await (await cultists.setMawSacrifice(addresses.mawSacrifice, { gasPrice: ethers.parseUnits("3", "gwei") })).wait();
    console.log("✅ MawSacrifice authorized in Cultists");
  } catch (error) {
    console.log("⚠️ Cultists authorization error:", error.message);
  }
  
  // Test the new MawSacrifice
  console.log("\n🧪 Testing new MawSacrifice...");
  const ashesPerVial = await maw.ashesPerVial();
  console.log("Ashes per vial:", ashesPerVial.toString());
  
  if (ashesPerVial.toString() === "25") {
    console.log("✅ MawSacrifice is properly configured!");
  } else {
    console.log("❌ MawSacrifice configuration issue");
  }
  
  console.log("\n🎉 MawSacrifice setup complete!");
  console.log("Try the ash functionality now - it should work with 25 ashes = 1 vial");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });