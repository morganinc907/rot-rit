const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Redeploying MawSacrifice with ash fixes...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Load existing contract addresses
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  console.log("Using existing contracts:");
  console.log("  Relics:", addresses.relics);
  console.log("  Cosmetics:", addresses.cosmetics);
  console.log("  Demons:", addresses.demons);
  console.log("  Cultists:", addresses.cultists);

  // Deploy new MawSacrifice with fixes
  console.log("\n📄 Deploying fixed MawSacrifice...");
  const MawSacrifice = await ethers.getContractFactory("MawSacrifice");
  const maw = await MawSacrifice.deploy(
    addresses.relics,
    addresses.cosmetics,
    addresses.demons,
    addresses.cultists,
    {
      gasPrice: ethers.parseUnits("2", "gwei"),
    }
  );
  await maw.waitForDeployment();
  
  const mawAddress = await maw.getAddress();
  console.log("✅ Fixed MawSacrifice deployed to:", mawAddress);

  // Configure MawSacrifice settings
  console.log("\n⚙️ Configuring MawSacrifice...");
  await (await maw.setMinBlocksBetweenSacrifices(1)).wait();
  await (await maw.setAshesPerVial(25)).wait(); // Fixed to 25!
  console.log("✅ MawSacrifice configured with 25 ashes per vial");

  // Update contract addresses file
  addresses.mawSacrifice = mawAddress;
  addresses.blockNumber = await ethers.provider.getBlockNumber();
  addresses.note = "Fixed MawSacrifice - ASHES = token ID 9, 25 ashes = 1 vial";
  
  fs.writeFileSync('./src/contracts-base-sepolia.json', JSON.stringify(addresses, null, 2));
  console.log("\n✅ Updated contracts-base-sepolia.json");

  console.log("\n🎯 FIXES APPLIED:");
  console.log("  ✅ ASHES constant changed from 8 to 9");
  console.log("  ✅ ashesPerVial set to 25 (was 50)");
  console.log("  ✅ Deployment script updated");

  console.log("\n⚠️  MANUAL STEPS REQUIRED:");
  console.log("  1. Update other contracts to authorize new MawSacrifice address");
  console.log("  2. Set up monthly cosmetics if needed");
  console.log("  3. Test ash generation and conversion");

  console.log("\nNew MawSacrifice address:", mawAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });