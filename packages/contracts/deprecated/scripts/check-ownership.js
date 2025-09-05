const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking raccoon ownership...");
  
  const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);
  
  try {
    const totalMinted = await raccoons.totalMinted();
    console.log(`Total minted: ${totalMinted}`);
    
    console.log("\nRaccoon ownership:");
    for (let tokenId = 1; tokenId <= totalMinted; tokenId++) {
      try {
        const owner = await raccoons.ownerOf(tokenId);
        const tokenURI = await raccoons.tokenURI(tokenId);
        console.log(`Token #${tokenId}: Owner ${owner}`);
        console.log(`  URI: ${tokenURI}`);
      } catch (error) {
        console.log(`Token #${tokenId}: Error - ${error.message}`);
      }
    }
    
    // Check unique owners
    const owners = new Set();
    for (let tokenId = 1; tokenId <= totalMinted; tokenId++) {
      try {
        const owner = await raccoons.ownerOf(tokenId);
        owners.add(owner);
      } catch (error) {
        // Skip if error
      }
    }
    
    console.log(`\nUnique owners: ${owners.size}`);
    owners.forEach(owner => {
      console.log(`  ${owner}`);
    });
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });