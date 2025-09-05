const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking proxy contract references...");
  
  const networkAddresses = addresses.baseSepolia;
  console.log("Expected addresses from addresses.json:");
  console.log("- MawSacrifice:", networkAddresses.MawSacrifice);
  console.log("- Cosmetics:", networkAddresses.Cosmetics);
  console.log("- Relics:", networkAddresses.Relics);
  console.log("- Cultists:", networkAddresses.Cultists);
  console.log("- Raccoons:", networkAddresses.Raccoons);
  console.log("");
  
  try {
    // Check MawSacrifice proxy references
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrifice);
    
    console.log("MawSacrifice proxy actual references:");
    const cosmetics = await maw.cosmetics();
    const relics = await maw.relics();
    const cultists = await maw.cultists();
    const raccoons = await maw.raccoons();
    
    console.log("- Cosmetics:", cosmetics);
    console.log("- Relics:", relics);
    console.log("- Cultists:", cultists);
    console.log("- Raccoons:", raccoons);
    console.log("");
    
    console.log("Match check:");
    console.log("- Cosmetics match:", cosmetics.toLowerCase() === networkAddresses.Cosmetics.toLowerCase());
    console.log("- Relics match:", relics.toLowerCase() === networkAddresses.Relics.toLowerCase());
    console.log("- Cultists match:", cultists.toLowerCase() === networkAddresses.Cultists.toLowerCase());
    console.log("- Raccoons match:", raccoons.toLowerCase() === networkAddresses.Raccoons.toLowerCase());
    
    // Check if Relics has MawSacrifice set correctly
    console.log("\nChecking Relics authorization:");
    const relicsContract = await ethers.getContractAt("Relics", networkAddresses.Relics);
    const mawInRelics = await relicsContract.mawSacrifice();
    console.log("- MawSacrifice in Relics:", mawInRelics);
    console.log("- Relics->Maw match:", mawInRelics.toLowerCase() === networkAddresses.MawSacrifice.toLowerCase());
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
