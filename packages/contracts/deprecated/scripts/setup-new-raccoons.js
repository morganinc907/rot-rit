const hre = require("hardhat");

const RACCOONS_ADDRESS = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";
const YOUR_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";

async function main() {
  console.log("Setting up new raccoons contract...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  try {
    // Check current status first
    const balance = await raccoons.balanceOf(YOUR_ADDRESS);
    console.log("Current balance:", balance.toString());
    
    const revealed = await raccoons.revealed();
    console.log("Revealed:", revealed);
    
    const baseURI = await raccoons.baseTokenURI();
    console.log("Base URI:", baseURI);
    
    // Only set base URI if not already set
    if (!baseURI || baseURI.length === 0) {
      console.log("Setting base URI...");
      const tx1 = await raccoons.setBaseTokenURI("ipfs://bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4/");
      console.log("Tx hash:", tx1.hash);
      await tx1.wait();
      console.log("✅ Base URI set");
    }
    
    // Only reveal if not already revealed
    if (!revealed) {
      console.log("Setting revealed...");
      const tx2 = await raccoons.setRevealed(true);
      console.log("Tx hash:", tx2.hash);
      await tx2.wait();
      console.log("✅ Revealed");
    }
    
    // Only mint if balance is 0
    if (balance == 0) {
      console.log("Minting raccoon...");
      const tx3 = await raccoons.ownerMint(YOUR_ADDRESS, 1);
      console.log("Tx hash:", tx3.hash);
      await tx3.wait();
      console.log("✅ Minted!");
    }
    
    // Test the new joinCult function
    const newBalance = await raccoons.balanceOf(YOUR_ADDRESS);
    if (newBalance > 0) {
      const tokenId = await raccoons.tokenOfOwnerByIndex(YOUR_ADDRESS, 0);
      console.log("Token ID:", tokenId.toString());
      
      const uri = await raccoons.tokenURI(tokenId);
      console.log("TokenURI:", uri);
      
      const state = await raccoons.getState(tokenId);
      console.log("Current state:", state); // 0=Normal, 1=Cult, 2=Dead
    }
    
    console.log("🎉 Setup complete!");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);