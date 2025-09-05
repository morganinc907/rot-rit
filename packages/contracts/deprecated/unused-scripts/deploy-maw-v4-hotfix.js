const { upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MawSacrificeV4Upgradeable Hotfix (Interface Fixed)...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy fresh V4Upgradeable with correct interface
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const COSMETICS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const DEMONS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  const CULTISTS = "0x2D7cD25A014429282062298d2F712FA7983154B9";
  const MIN_BLOCKS = 1;
  
  console.log("Deploying fresh UUPS proxy with V4Upgradeable...");
  
  const maw = await upgrades.deployProxy(
    await ethers.getContractFactory("MawSacrificeV4Upgradeable"),
    [RELICS, COSMETICS, DEMONS, CULTISTS, MIN_BLOCKS],
    { 
      kind: 'uups',
      initializer: 'initialize'
    }
  );
  
  await maw.waitForDeployment();
  const mawAddress = await maw.getAddress();
  
  console.log("✅ New MawSacrificeV4Upgradeable proxy deployed to:", mawAddress);
  
  // Set cosmetic types immediately
  console.log("\n🎨 Setting cosmetic types...");
  await (await maw.setMonthlyCosmeticTypes([1, 2, 3, 4, 5])).wait();
  console.log("✅ Cosmetic types set");
  
  // Authorize on Relics
  console.log("\n🔑 Authorizing on Relics...");
  const relics = await ethers.getContractAt("Relics", RELICS);
  await (await relics.authorizeBurner(mawAddress)).wait();
  console.log("✅ Authorized as burner on Relics");
  
  // Update Relics with new address  
  console.log("\n📝 Updating Relics maw address...");
  await (await relics.setMawSacrificeAddress(mawAddress)).wait();
  console.log("✅ Relics updated");
  
  // Update Cosmetics with new address
  console.log("\n📝 Updating Cosmetics maw address...");
  const cosmetics = await ethers.getContractAt("CosmeticsV2", COSMETICS);
  await (await cosmetics.setMawSacrifice(mawAddress)).wait();
  console.log("✅ Cosmetics updated");
  
  // Test the function
  console.log("\n=== TESTING SACRIFICE FUNCTION ===");
  try {
    await maw.sacrificeForCosmetic.staticCall(1, 0);
    console.log("✅ sacrificeForCosmetic works!");
  } catch (error) {
    console.log("❌ Still failing:", error.message);
  }
  
  console.log("\n🎉 HOTFIX DEPLOYMENT COMPLETE!");
  console.log("New MawSacrifice Address:", mawAddress);
  console.log("Update frontend to use this new address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });