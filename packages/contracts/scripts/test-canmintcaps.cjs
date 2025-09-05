const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Testing canMintCaps function...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  
  // Test canMintCaps from user's perspective
  try {
    const canMintResult = await maw.canMintCaps(1, { from: USER_ADDRESS });
    console.log("canMintCaps(1) returned:", canMintResult);
  } catch (error) {
    console.log("canMintCaps failed:", error.message);
  }
  
  // Test what happens when we try to call the relics mint function directly
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  try {
    // This should fail because user is not authorized
    await relics.mint.staticCall(USER_ADDRESS, 0, 1, "", { from: USER_ADDRESS });
    console.log("✅ User can mint rusted caps directly (unexpected)");
  } catch (error) {
    console.log("❌ User cannot mint rusted caps directly (expected)");
  }
  
  // Test if MAW contract can mint
  try {
    await relics.mint.staticCall(USER_ADDRESS, 0, 1, "", { from: PROXY_ADDRESS });
    console.log("✅ MAW contract can mint rusted caps (expected)");
  } catch (error) {
    console.log("❌ MAW contract cannot mint rusted caps:", error.message);
  }
}

main().catch(console.error);