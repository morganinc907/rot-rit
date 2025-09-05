const hre = require("hardhat");

const RACCOONS_ADDRESS = "0x84d329C3a42Ad20Eb3335f6c86384ECd550c0aBa";
const YOUR_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";

async function main() {
  console.log("Debugging raccoon balance...");
  console.log("Contract:", RACCOONS_ADDRESS);
  console.log("Address:", YOUR_ADDRESS);
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  try {
    // Check total supply
    const totalSupply = await raccoons.totalSupply();
    console.log("Total Supply:", totalSupply.toString());
    
    // Check total minted
    const totalMinted = await raccoons.totalMinted();
    console.log("Total Minted:", totalMinted.toString());
    
    // Check balance of your address
    const balance = await raccoons.balanceOf(YOUR_ADDRESS);
    console.log("Your Balance:", balance.toString());
    
    if (balance > 0) {
      console.log("\nYou have raccoons! Testing enumerable functions...");
      
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await raccoons.tokenOfOwnerByIndex(YOUR_ADDRESS, i);
          console.log(`Token ${i}: ID ${tokenId}`);
          
          const owner = await raccoons.ownerOf(tokenId);
          console.log(`Token ${tokenId} owner: ${owner}`);
          
          const exists = await raccoons.exists(tokenId);
          console.log(`Token ${tokenId} exists: ${exists}`);
        } catch (err) {
          console.error(`Error getting token ${i}:`, err.message);
        }
      }
    } else {
      console.log("\nNo raccoons found! Let me mint one...");
      
      const mintTx = await raccoons.ownerMint(YOUR_ADDRESS, 1, {
        gasLimit: 300000,
        gasPrice: hre.ethers.parseUnits("3", "gwei")
      });
      await mintTx.wait();
      
      console.log("✅ Minted 1 raccoon!");
      
      // Check again
      const newBalance = await raccoons.balanceOf(YOUR_ADDRESS);
      console.log("New Balance:", newBalance.toString());
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);