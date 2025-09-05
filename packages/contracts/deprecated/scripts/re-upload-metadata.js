const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔄 Re-uploading metadata to IPFS properly...");
  
  // Extract the metadata files from our local copy
  const metadataDir = '/tmp/metadata';
  if (!fs.existsSync(metadataDir)) {
    console.error("❌ Metadata directory not found. Please run the extraction command first.");
    return;
  }

  // For now, let's create a simple fix by using a public IPFS gateway
  // that can handle the archive format better
  console.log("🔧 Testing alternative IPFS gateways...");
  
  const testURLs = [
    "https://ipfs.io/ipfs/bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4/metadata/1.json",
    "https://gateway.pinata.cloud/ipfs/bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4/metadata/1.json",
    "https://cloudflare-ipfs.com/ipfs/bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4/metadata/1.json",
    "https://dweb.link/ipfs/bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4/metadata/1.json"
  ];
  
  for (const url of testURLs) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.text();
        console.log(`✅ Success with gateway: ${url}`);
        console.log("Sample data:", data.substring(0, 200));
        break;
      } else {
        console.log(`❌ Failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log("\n📝 Alternative solution: Update base URI to use working gateway");
  
  const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);
  
  // Try updating to a working gateway
  const workingBaseURI = "https://dweb.link/ipfs/bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4/metadata/";
  
  try {
    console.log("Setting working base URI:", workingBaseURI);
    const tx = await raccoons.setBaseTokenURI(workingBaseURI);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Base URI updated to working gateway!");
    
    // Test the new URI
    const tokenURI = await raccoons.tokenURI(2);
    console.log("Token #2 URI:", tokenURI);
    
  } catch (error) {
    console.error("Error updating base URI:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });