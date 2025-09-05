const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking Demon contract metadata configuration...\n");

  const demonsAddress = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  const demons = await hre.ethers.getContractAt("Demons", demonsAddress);

  try {
    // Check base image URI
    const baseImageURI = await demons.baseImageURI();
    console.log("Base Image URI:", baseImageURI || "(not set)");

    // Check ritual address
    const ritual = await demons.ritual();
    console.log("Ritual (authorized minter):", ritual);

    // Check total minted
    const totalMinted = await demons.totalMinted();
    console.log("Total Demons minted:", totalMinted.toString());

    // Check if we can see trait data setup
    console.log("\nTrait Data Setup:");
    for (let traitType = 0; traitType <= 4; traitType++) {
      const traitCount = await demons.getTraitCount(traitType);
      const traitNames = ["Head", "Face", "Form", "Aura", "Background"];
      console.log(`  ${traitNames[traitType]}: ${traitCount} variants configured`);
    }

  } catch (error) {
    console.error("Error checking metadata:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });