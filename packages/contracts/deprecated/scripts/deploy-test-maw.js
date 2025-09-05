const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🧪 Deploying test MawSacrifice for cosmetic testing...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Load current addresses
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  console.log("Using existing contract addresses:");
  console.log("Relics:", addresses.relics);
  console.log("Cosmetics:", addresses.cosmetics);
  console.log("Demons:", addresses.demons);
  console.log("Cultists:", addresses.cultists);
  
  // Deploy new MawSacrifice that you'll own
  console.log("\n🔧 Deploying YOUR MawSacrifice...");
  const MawSacrifice = await hre.ethers.getContractFactory("MawSacrifice");
  const mawSacrifice = await MawSacrifice.deploy(
    addresses.relics,
    addresses.cosmetics,
    addresses.demons,
    addresses.cultists
  );
  
  await mawSacrifice.waitForDeployment();
  const newMawAddress = await mawSacrifice.getAddress();
  console.log("✅ Your MawSacrifice deployed to:", newMawAddress);
  
  // Set up test cosmetics immediately
  console.log("\n🎨 Setting up test cosmetics...");
  const testCosmeticIds = [1, 2, 3, 4, 5];
  const monthlySetId = 1;
  
  const tx = await mawSacrifice.setMonthlyCosmetics(monthlySetId, testCosmeticIds);
  await tx.wait();
  console.log("✅ Test cosmetics configured!");
  
  // Create a separate config file for testing
  const testAddresses = {
    ...addresses,
    mawSacrifice: newMawAddress,
    originalMawSacrifice: addresses.mawSacrifice // Keep original for reference
  };
  
  fs.writeFileSync('./src/contracts-test.json', JSON.stringify(testAddresses, null, 2));
  console.log("✅ Test config saved to contracts-test.json");
  
  console.log("\n🎉 Test deployment complete!");
  console.log("Your MawSacrifice address:", newMawAddress);
  console.log("Cosmetics configured: [1, 2, 3, 4, 5]");
  console.log("\nTo use this for testing:");
  console.log("1. Update your frontend to use contracts-test.json");
  console.log("2. Or manually change the mawSacrifice address in your app");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });