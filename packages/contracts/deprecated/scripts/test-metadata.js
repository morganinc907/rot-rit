const hre = require("hardhat");
require("dotenv").config();

const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing metadata after revelation...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  // Check revealed status
  const revealed = await raccoons.revealed();
  console.log("Revealed:", revealed);
  
  const baseTokenURI = await raccoons.baseTokenURI();
  console.log("Base Token URI:", baseTokenURI);
  
  // Test normal token metadata (should use individual JSON files now)
  try {
    const uri1 = await raccoons.tokenURI(1);
    console.log("Token #1 URI (Normal):", uri1);
    
    const uri2 = await raccoons.tokenURI(2);
    console.log("Token #2 URI (Normal):", uri2);
  } catch (e) {
    console.log("Error getting normal URIs:", e.message);
  }
  
  // Test cult state URI (token #1 was changed to cult state)
  try {
    const uri1Cult = await raccoons.tokenURI(1);
    console.log("Token #1 URI (Cult state):", uri1Cult);
  } catch (e) {
    console.log("Error getting cult URI:", e.message);
  }
  
  // Test state values
  try {
    const state1 = await raccoons.getState(1);
    const state2 = await raccoons.getState(2);
    console.log("Token #1 state:", state1.toString(), "(0=Normal, 1=Cult, 2=Dead)");
    console.log("Token #2 state:", state2.toString(), "(0=Normal, 1=Cult, 2=Dead)");
  } catch (e) {
    console.log("Error getting states:", e.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});