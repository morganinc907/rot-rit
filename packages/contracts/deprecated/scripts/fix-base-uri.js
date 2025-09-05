const hre = require("hardhat");

async function main() {
  console.log("🔧 Fixing base URI...");
  
  const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);
  
  try {
    // Check current base URI
    const currentBaseURI = await raccoons.baseTokenURI();
    console.log("Current base URI:", currentBaseURI);
    
    // Set correct base URI with metadata folder
    const newBaseURI = "ipfs://bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4/metadata/";
    console.log("Setting new base URI:", newBaseURI);
    
    const tx = await raccoons.setBaseTokenURI(newBaseURI);
    console.log("Transaction hash:", tx.hash);
    
    await tx.wait();
    console.log("✅ Base URI updated!");
    
    // Verify the change
    const updatedBaseURI = await raccoons.baseTokenURI();
    console.log("Updated base URI:", updatedBaseURI);
    
    // Test a token URI
    console.log("\nTesting token URIs:");
    for (let i = 1; i <= 3; i++) {
      const tokenURI = await raccoons.tokenURI(i);
      console.log(`Token #${i} URI: ${tokenURI}`);
    }
    
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