const hre = require("hardhat");

const RACCOONS_ADDRESS = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";
const NEW_BASE_URI = "ipfs://bafybeigdtwu46behz65gnvk4g2eslcrepe2caxlfu3xp467hzcamdo7ldm/";

async function main() {
  console.log("Updating baseURI to use proper raccoon metadata...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  try {
    const currentBaseURI = await raccoons.baseTokenURI();
    console.log("Current base URI:", currentBaseURI);
    
    console.log("Setting new base URI:", NEW_BASE_URI);
    const tx = await raccoons.setBaseTokenURI(NEW_BASE_URI, { gasPrice: hre.ethers.parseUnits("20", "gwei") });
    console.log("Tx hash:", tx.hash);
    await tx.wait();
    console.log("✅ Base URI updated!");
    
    // Test the result
    const tokenId = 1;
    const newURI = await raccoons.tokenURI(tokenId);
    console.log("Token 1 URI:", newURI);
    
    // Test cult URI (should fail for now since cult.json doesn't exist yet)
    const state = await raccoons.getState(tokenId);
    console.log("Token 1 state:", state == 0 ? "Normal" : state == 1 ? "Cult" : "Dead");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);