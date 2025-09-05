const hre = require("hardhat");

async function main() {
  const RACCOONS_ADDRESS = "0xAFC30C3f38487592bc2F67AaAB5aE30368b6B586";
  const YOUR_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";

  console.log("Emergency mint setup...");
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  // Just do the essential setup
  try {
    const revealed = await raccoons.revealed();
    if (!revealed) {
      console.log("Setting revealed...");
      await (await raccoons.setRevealed(true, { gasPrice: hre.ethers.parseUnits("5", "gwei") })).wait();
    }

    const baseURI = await raccoons.baseTokenURI();
    if (!baseURI || baseURI.length === 0) {
      console.log("Setting base URI...");
      await (await raccoons.setBaseTokenURI("ipfs://bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4/", { gasPrice: hre.ethers.parseUnits("5", "gwei") })).wait();
    }

    const balance = await raccoons.balanceOf(YOUR_ADDRESS);
    if (balance == 0) {
      console.log("Minting raccoon...");
      await (await raccoons.ownerMint(YOUR_ADDRESS, 1, { gasPrice: hre.ethers.parseUnits("5", "gwei") })).wait();
    }

    console.log("✅ Setup complete!");
    console.log("Balance:", (await raccoons.balanceOf(YOUR_ADDRESS)).toString());
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);