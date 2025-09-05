const hre = require("hardhat");

const COSMETICS_ADDRESS = "0x0de59ef75ddf2d7c6310f5f8c84bb52e6e0873b3";

async function main() {
  console.log("Checking CosmeticsV2 configuration...");
  
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);

  try {
    const racconsAddress = await cosmetics.raccoons();
    console.log("CosmeticsV2.raccoons():", racconsAddress);
    
    const mawAddress = await cosmetics.mawSacrifice();
    console.log("CosmeticsV2.mawSacrifice():", mawAddress);
    
    console.log("\nExpected:");
    console.log("Raccoons: 0x94A3b9aF19728B8ed34ff7435b4dFe9279909EF7");
    console.log("Maw: 0x1F8fA66b4e91C844Db85b8FC95e1e78E4BF56b13");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);