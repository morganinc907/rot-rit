const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking contract state after upgrades...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  
  try {
    // Check if contract references are set correctly
    const relicsAddr = await maw.relics();
    const cosmeticsAddr = await maw.cosmetics();
    console.log("Contract references:");
    console.log(`  relics: ${relicsAddr}`);
    console.log(`  cosmetics: ${cosmeticsAddr}`);
    console.log(`  expected relics: ${addresses.baseSepolia.Relics}`);
    console.log(`  expected cosmetics: ${addresses.baseSepolia.Cosmetics}`);
    
    // Check if any are zero address
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    if (relicsAddr === zeroAddress) {
      console.log("❌ Relics address is zero - this will cause failures");
    }
    if (cosmeticsAddr === zeroAddress) {
      console.log("❌ Cosmetics address is zero - this will cause failures");
    }
    
    // Check other state variables
    const sacrificeNonce = await maw.sacrificeNonce();
    const sacrificesPaused = await maw.sacrificesPaused();
    const conversionsPaused = await maw.conversionsPaused();
    
    console.log("\nState variables:");
    console.log(`  sacrificeNonce: ${sacrificeNonce}`);
    console.log(`  sacrificesPaused: ${sacrificesPaused}`);
    console.log(`  conversionsPaused: ${conversionsPaused}`);
    
    // Check cosmetic types
    const currentTypes = await maw.currentCosmeticTypes(0).catch(() => "Error getting types");
    console.log(`  currentCosmeticTypes[0]: ${currentTypes}`);
    
  } catch (error) {
    console.log("❌ Error checking contract state:", error.message);
    
    // If we can't read basic state, the contract might be broken
    if (error.message.includes("execution reverted")) {
      console.log("🚨 Contract state appears to be corrupted");
      console.log("This might require redeploying or reinitializing the contract");
    }
  }
}

main().catch(console.error);