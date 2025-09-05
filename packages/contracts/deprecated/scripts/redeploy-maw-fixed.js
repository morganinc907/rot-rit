const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔧 Redeploying MawSacrifice with ash fix...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Load current addresses
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  console.log("Current addresses:");
  console.log("Relics:", addresses.relics);
  console.log("Cosmetics:", addresses.cosmetics);
  console.log("Demons:", addresses.demons);
  console.log("Cultists:", addresses.cultists);
  
  // Deploy new MawSacrifice
  console.log("\n🔧 Deploying new MawSacrifice...");
  const MawSacrifice = await ethers.getContractFactory("MawSacrifice");
  const mawSacrifice = await MawSacrifice.deploy(
    addresses.relics,
    addresses.cosmetics,
    addresses.demons,
    addresses.cultists,
    {
      gasPrice: ethers.parseUnits("4", "gwei"),
    }
  );
  
  await mawSacrifice.waitForDeployment();
  const newMawAddress = await mawSacrifice.getAddress();
  console.log("✅ New MawSacrifice deployed to:", newMawAddress);
  
  // Update addresses file
  addresses.mawSacrifice = newMawAddress;
  fs.writeFileSync('./src/contracts-base-sepolia.json', JSON.stringify(addresses, null, 2));
  console.log("✅ Address file updated");
  
  // Authorize new contract in Relics
  console.log("\n🔧 Authorizing new MawSacrifice in Relics...");
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  const authTx = await relics.setMawSacrifice(newMawAddress, {
    gasPrice: ethers.parseUnits("4", "gwei"),
  });
  await authTx.wait();
  console.log("✅ New MawSacrifice authorized");
  
  console.log("\n🎉 Deployment complete!");
  console.log("New MawSacrifice address:", newMawAddress);
  console.log("You can now test ash minting for failed key sacrifices!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });