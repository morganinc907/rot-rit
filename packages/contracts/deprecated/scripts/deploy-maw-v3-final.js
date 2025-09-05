const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MawSacrificeV3 Final with all security updates...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Get existing contract addresses from addresses.json
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const COSMETICS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const DEMONS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  const CULTISTS = "0x2D7cD25A014429282062298d2F712FA7983154B9";
  
  // Deploy MawSacrificeV3
  const MawSacrifice = await hre.ethers.getContractFactory("MawSacrificeV3");
  const maw = await MawSacrifice.deploy(
    RELICS,
    COSMETICS,
    DEMONS,
    CULTISTS
  );
  
  await maw.waitForDeployment();
  const mawAddress = await maw.getAddress();
  
  console.log("✅ MawSacrificeV3 deployed to:", mawAddress);
  
  // Authorize new MawSacrifice as burner on Relics
  console.log("\n🔑 Authorizing MawSacrifice as burner on Relics...");
  const relics = await hre.ethers.getContractAt("Relics", RELICS);
  await (await relics.authorizeBurner(mawAddress)).wait();
  console.log("✅ MawSacrifice authorized as burner");
  
  // Authorize new MawSacrifice as burner on Cultists
  console.log("\n🔑 Authorizing MawSacrifice as burner on Cultists...");
  const cultists = await hre.ethers.getContractAt("Cultists", CULTISTS);
  await (await cultists.authorizeBurner(mawAddress)).wait();
  console.log("✅ MawSacrifice authorized on Cultists");
  
  // Update Relics with new MawSacrifice address
  console.log("\n📝 Updating Relics with new MawSacrifice address...");
  await (await relics.setMawSacrificeAddress(mawAddress)).wait();
  console.log("✅ Relics updated with new MawSacrifice address");
  
  // Update Cosmetics with new MawSacrifice address
  console.log("\n📝 Updating Cosmetics with new MawSacrifice address...");
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", COSMETICS);
  await (await cosmetics.setMawSacrifice(mawAddress)).wait();
  console.log("✅ Cosmetics updated with new MawSacrifice address");
  
  console.log("\n" + "=".repeat(50));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  console.log("\n📋 New MawSacrificeV3 Features:");
  console.log("  ✅ Glass Shards instead of Ashes");
  console.log("  ✅ Rusted Caps instead of Keys");
  console.log("  ✅ 5 Glass Shards = 1 Rusted Cap");
  console.log("  ✅ 50% shard chance on non-demon failures");
  console.log("  ✅ 100% shard on demon failures");
  console.log("  ✅ Mythic demon cap: 100 max");
  console.log("  ✅ Anti-griefing bounds");
  console.log("  ✅ Complete event monitoring");
  
  console.log("\n📝 Contract Addresses:");
  console.log("  MawSacrificeV3:", mawAddress);
  console.log("  Relics:", RELICS);
  console.log("  Cosmetics:", COSMETICS);
  console.log("  Demons:", DEMONS);
  console.log("  Cultists:", CULTISTS);
  
  console.log("\n⚠️  IMPORTANT: Run postDeploy.js to update frontend!");
  console.log("  cd /packages/contracts && node scripts/postDeploy.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });