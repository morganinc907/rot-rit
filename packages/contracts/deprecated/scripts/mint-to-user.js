const hre = require("hardhat");

// Update this with your actual wallet address from the dapp
const USER_ADDRESS = "0xYOUR_WALLET_ADDRESS"; // Replace with your actual address
const RACCOONS_ADDRESS = "0x94A3b9aF19728B8ed34ff7435b4dFe9279909EF7";

async function main() {
  console.log("Minting raccoon to user address...");
  console.log("User address:", USER_ADDRESS);
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  // Owner mint to user address
  console.log("Minting 1 raccoon to user...");
  const mintTx = await raccoons.ownerMint(USER_ADDRESS, 1, {
    gasLimit: 200000
  });
  await mintTx.wait();
  
  console.log("✅ Raccoon minted to user!");
  
  // Check new total supply
  const totalSupply = await raccoons.totalSupply();
  console.log("New total supply:", totalSupply.toString());
}

main().catch(console.error);