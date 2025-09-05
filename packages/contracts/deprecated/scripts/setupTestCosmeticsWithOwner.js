const hre = require("hardhat");

async function main() {
  console.log("🎨 Setting up test cosmetics with owner account...");
  
  // If you have the owner's private key, uncomment and use it:
  // const ownerPrivateKey = "YOUR_OWNER_PRIVATE_KEY_HERE";
  // const owner = new hre.ethers.Wallet(ownerPrivateKey, hre.ethers.provider);
  
  const MAW_SACRIFICE_ADDRESS = "0x701b7ece2c33e71853a927a6e055d4c6b5a23664";
  
  // For now, let's just show what needs to be called
  console.log("The contract owner needs to call:");
  console.log(`MawSacrifice.setMonthlyCosmetics(1, [1, 2, 3, 4, 5])`);
  console.log("");
  console.log("Contract address:", MAW_SACRIFICE_ADDRESS);
  console.log("Owner address:", "0x52257934A41c55F4758b92F4D23b69f920c3652A");
  console.log("");
  console.log("If you have access to the owner account, you can:");
  console.log("1. Import the private key into MetaMask");
  console.log("2. Use a block explorer like BaseScan to call the function");
  console.log("3. Or uncomment the private key section above");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });