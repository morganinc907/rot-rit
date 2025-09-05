const hre = require("hardhat");

async function main() {
  console.log("🔧 Updating base URI with new IPFS hash...");
  
  const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);
  
  // The metadata IPFS hash
  const METADATA_CID = "bafybeidx3e4ps4zydxigku7v3dlnwzerexwcbleze5e7q3bms6h5exfxd4";
  
  try {
    // Check current base URI
    const currentBaseURI = await raccoons.baseTokenURI();
    console.log("Current base URI:", currentBaseURI);
    
    // Set new base URI to the metadata folder
    const newBaseURI = `ipfs://${METADATA_CID}/`;
    console.log("Setting new base URI:", newBaseURI);
    
    const tx = await raccoons.setBaseTokenURI(newBaseURI);
    console.log("Transaction hash:", tx.hash);
    
    await tx.wait();
    console.log("✅ Base URI updated!");
    
    // Test token URIs
    console.log("\nTesting token URIs:");
    for (let i = 1; i <= 3; i++) {
      const tokenURI = await raccoons.tokenURI(i);
      console.log(`Token #${i} URI: ${tokenURI}`);
    }
    
    console.log("\n📝 Metadata is accessible at:");
    console.log(`https://ipfs.io/ipfs/${METADATA_CID}/[tokenId].json`);
    
    console.log("\n⚠️  Note: The metadata references '../images/[id].png'");
    console.log("Images are at: ipfs://bafybeiaxmevcthi76k45i6buodpefmoavhdxdnsxrmliedytkzk4n2zt24/[id].png");
    
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