const hre = require("hardhat");

// Contract addresses
const RACCOONS_ADDRESS = "0x84d329C3a42Ad20Eb3335f6c86384ECd550c0aBa";
const COSMETICS_ADDRESS = "0x0De59eF75dDf2D7c6310f5F8c84bb52e6E0873B3".toLowerCase();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Finishing Raccoons setup...");
  console.log("Raccoons:", RACCOONS_ADDRESS);
  console.log("CosmeticsV2:", COSMETICS_ADDRESS);

  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  try {
    // Set cosmetics contract
    console.log("Setting cosmetics contract...");
    const cosmeticsTx = await raccoons.setCosmeticsContract(COSMETICS_ADDRESS, {
      gasLimit: 100000,
      gasPrice: hre.ethers.parseUnits("3", "gwei")
    });
    await cosmeticsTx.wait();
    console.log("✅ Cosmetics contract set");

    // Set dynamic metadata URI 
    console.log("Setting dynamic metadata URI...");
    const dynamicTx = await raccoons.setDynamicMetadataURI("http://localhost:3002", {
      gasLimit: 100000,
      gasPrice: hre.ethers.parseUnits("3", "gwei")
    });
    await dynamicTx.wait();
    console.log("✅ Dynamic metadata URI set");

    console.log("\n🎉 Raccoons setup complete!");
    console.log("✅ Contract can now show dynamic metadata with cosmetics");

  } catch (error) {
    console.error("❌ Setup failed:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});