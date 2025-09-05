const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MawSacrificeV3 with 5-arg demon sacrifice...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Use existing contract addresses
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const COSMETICS = "0x8184FdB709f6B810d94d4Ed2b6196866EF604e68";
  const DEMONS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  const CULTISTS = "0x2D7cD25A014429282062298d2F712FA7983154B9";

  console.log("📄 Using existing contracts:");
  console.log("- Relics:", RELICS);
  console.log("- Cosmetics:", COSMETICS);
  console.log("- Demons:", DEMONS);
  console.log("- Cultists:", CULTISTS);

  // Deploy MawSacrificeV3
  console.log("\n📄 Deploying MawSacrificeV3...");
  const MawSacrifice = await ethers.getContractFactory("MawSacrificeV3");
  const maw = await MawSacrifice.deploy(RELICS, COSMETICS, DEMONS, CULTISTS);
  await maw.waitForDeployment();
  const mawAddress = await maw.getAddress();
  console.log("✅ MawSacrificeV3 deployed to:", mawAddress);

  // Set up monthly cosmetics (same as before)
  console.log("\n🎨 Setting up monthly cosmetics...");
  const cosmeticTypes = [1, 2, 3, 4, 5]; // Example cosmetic type IDs
  const tx = await maw.setMonthlyCosmetics(1, cosmeticTypes);
  await tx.wait();
  console.log("✅ Monthly cosmetics set!");

  console.log("\n🎉 Deployment complete!");
  console.log("📋 IMPORTANT - Save this address:");
  console.log("MawSacrificeV3:", mawAddress);
  
  console.log("\n🔧 Next steps:");
  console.log("1. Update contracts-base-sepolia.json with new Maw address");
  console.log("2. Update src/hooks/useContracts.js with new Maw address");
  console.log("3. Run update-relics-maw-address.js to authorize new Maw on Relics");
  console.log("4. Approve the new Maw contract in the UI");
  
  console.log("\n✨ Features:");
  console.log("✅ sacrificeKeys - burns keys for random relics");
  console.log("✅ sacrificeForCosmetic - burns fragments/masks for cosmetics");
  console.log("✅ sacrificeForDemon(daggers, vials, useBindingContract, useSoulDeed, cultistTokenId)");
  console.log("  - Binding Contract guarantees rare demon");
  console.log("  - Soul Deed guarantees legendary demon");
  console.log("✅ convertAshes - converts 3 ashes to 1 ash vial");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });