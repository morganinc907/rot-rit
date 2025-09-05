const hre = require("hardhat");
require("dotenv").config();

const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Checking contract state...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  // Check all the state variables
  console.log("=== Contract State ===");
  const totalMinted = await raccoons.totalMinted();
  const totalSupply = await raccoons.totalSupply();
  const maxSupply = await raccoons.MAX_SUPPLY();
  
  console.log("totalMinted():", totalMinted.toString());
  console.log("totalSupply():", totalSupply.toString());
  console.log("MAX_SUPPLY():", maxSupply.toString());
  
  // Check if token 1 exists
  try {
    const exists1 = await raccoons.exists(1);
    console.log("Token 1 exists:", exists1);
  } catch (e) {
    console.log("Token 1 exists: error -", e.message);
  }
  
  // Check owner of token 1
  try {
    const owner1 = await raccoons.ownerOf(1);
    console.log("Token 1 owner:", owner1);
  } catch (e) {
    console.log("Token 1 owner: error -", e.message);
  }

  // Check total supply from ERC721 perspective  
  try {
    const erc721TotalSupply = await raccoons.balanceOf(deployer.address);
    console.log("Deployer balance (ERC721):", erc721TotalSupply.toString());
  } catch (e) {
    console.log("ERC721 balance error:", e.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});