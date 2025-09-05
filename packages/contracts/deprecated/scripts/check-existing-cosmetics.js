const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking what cosmetics exist...");
  
  const COSMETICS_ADDRESS = "0x65B738dEfE0A065CFc1Fb4b20c191b15c5869756";
  const cosmetics = await hre.ethers.getContractAt("Cosmetics", COSMETICS_ADDRESS);
  
  // Try to get info for cosmetic IDs 1-10 to see which ones exist
  console.log("Testing cosmetic IDs 1-10:");
  for (let i = 1; i <= 10; i++) {
    try {
      const info = await cosmetics.getCosmeticInfo(i);
      console.log(`Cosmetic ${i}: rarity=${info[0]}, setId=${info[1]}`);
    } catch (e) {
      console.log(`Cosmetic ${i}: doesn't exist`);
    }
  }
  
  // Check if we can find the current monthly set
  console.log("\nChecking for cosmetics in monthly set 1:");
  try {
    const setCosmetics = await cosmetics.getMonthlySetCosmetics(1);
    console.log("Set 1 cosmetics:", setCosmetics.map(id => id.toString()));
  } catch (e) {
    console.log("Can't read monthly set cosmetics:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });