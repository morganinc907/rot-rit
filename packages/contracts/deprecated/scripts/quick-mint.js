const hre = require("hardhat");

const RACCOONS_ADDRESS = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";
const YOUR_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";

async function main() {
  console.log("Quick mint and setup...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  try {
    // Set base URI and reveal
    console.log("Setting base URI...");
    await (await raccoons.setBaseTokenURI("ipfs://bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4/", { gasPrice: hre.ethers.parseUnits("50", "gwei") })).wait();
    
    console.log("Setting revealed...");
    await (await raccoons.setRevealed(true, { gasPrice: hre.ethers.parseUnits("50", "gwei") })).wait();
    
    // Check balance first
    const balance = await raccoons.balanceOf(YOUR_ADDRESS);
    console.log("Current balance:", balance.toString());
    
    if (balance == 0) {
      console.log("Minting raccoon...");
      await (await raccoons.ownerMint(YOUR_ADDRESS, 1, { gasPrice: hre.ethers.parseUnits("50", "gwei") })).wait();
      console.log("✅ Minted!");
    }
    
    // Test tokenURI
    const newBalance = await raccoons.balanceOf(YOUR_ADDRESS);
    console.log("New balance:", newBalance.toString());
    
    if (newBalance > 0) {
      const tokenId = await raccoons.tokenOfOwnerByIndex(YOUR_ADDRESS, 0);
      console.log("Token ID:", tokenId.toString());
      
      const uri = await raccoons.tokenURI(tokenId);
      console.log("TokenURI:", uri);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);