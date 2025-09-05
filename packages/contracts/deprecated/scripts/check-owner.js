const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking account and ownership...");
  
  const [signer] = await hre.ethers.getSigners();
  const signerAddress = await signer.getAddress();
  console.log("Your account:", signerAddress);
  
  const MAW_SACRIFICE_ADDRESS = "0x701b7ece2c33e71853a927a6e055d4c6b5a23664";
  const maw = await hre.ethers.getContractAt("MawSacrifice", MAW_SACRIFICE_ADDRESS);
  
  const owner = await maw.owner();
  console.log("Contract owner:", owner);
  
  const isOwner = signerAddress.toLowerCase() === owner.toLowerCase();
  console.log("Are you the owner?", isOwner);
  
  if (!isOwner) {
    console.log("\n❌ You're not the owner! You need the private key for:", owner);
    console.log("Check your .env file's PRIVATE_KEY value");
  } else {
    console.log("\n✅ You are the owner! The cosmetic setup should work.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });