const hre = require("hardhat");

const RACCOONS_ADDRESS = "0x84d329C3a42Ad20Eb3335f6c86384ECd550c0aBa";

async function main() {
  console.log("Minting raccoon on enumerable contract...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  // Try owner mint first
  console.log("Owner minting 1 raccoon...");
  const ownerMintTx = await raccoons.ownerMint(await (await hre.ethers.getSigners())[0].getAddress(), 1, {
    gasLimit: 300000
  });
  await ownerMintTx.wait();
  
  console.log("✅ Owner mint successful!");
  
  // Check total supply and test enumerable functions
  const totalSupply = await raccoons.totalSupply();
  console.log("Total supply:", totalSupply.toString());

  if (totalSupply > 0) {
    // Test enumerable function
    console.log("Testing enumerable functions...");
    const tokenByIndex = await raccoons.tokenByIndex(0);
    console.log("Token by index 0:", tokenByIndex.toString());
    
    const owner = await (await hre.ethers.getSigners())[0].getAddress();
    const balance = await raccoons.balanceOf(owner);
    console.log("Balance:", balance.toString());
    
    if (balance > 0) {
      const tokenOfOwner = await raccoons.tokenOfOwnerByIndex(owner, 0);
      console.log("Token of owner by index 0:", tokenOfOwner.toString());
    }
  }

  console.log("🎉 Enumerable Raccoons contract is working!");
}

main().catch(console.error);