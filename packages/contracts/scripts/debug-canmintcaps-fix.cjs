const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Debugging canMintCaps after fix...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  console.log("MAW contract:", PROXY_ADDRESS);
  console.log("Relics contract:", RELICS_ADDRESS);
  
  // Test if MAW contract can mint directly
  console.log("\n🧪 Testing MAW contract mint permissions...");
  try {
    await relics.mint.staticCall(PROXY_ADDRESS, 0, 1, "", { from: PROXY_ADDRESS });
    console.log("✅ MAW contract can mint rusted caps to itself");
  } catch (error) {
    console.log("❌ MAW contract cannot mint rusted caps:", error.message);
  }
  
  // Test canMintCaps function
  console.log("\n🧪 Testing canMintCaps function...");
  const canMint = await maw.canMintCaps(1);
  console.log("canMintCaps(1) returns:", canMint);
  
  // Check what happens if we directly call the static call that canMintCaps uses
  console.log("\n🧪 Testing the exact static call from canMintCaps...");
  try {
    const [success, data] = await relics.mint.staticCall.populateTransaction(PROXY_ADDRESS, 0, 1, "");
    console.log("Static call would be to:", success.to);
    console.log("Static call data:", success.data);
    
    // Now test if this call would succeed from MAW contract context
    const staticCallResult = await ethers.provider.call({
      to: RELICS_ADDRESS,
      data: ethers.utils.id("mint(address,uint256,uint256,bytes)").substring(0, 10) +
            ethers.utils.defaultAbiCoder.encode(
              ["address", "uint256", "uint256", "bytes"],
              [PROXY_ADDRESS, 0, 1, "0x"]
            ).substring(2),
      from: PROXY_ADDRESS
    });
    console.log("✅ Direct static call succeeded");
  } catch (error) {
    console.log("❌ Direct static call failed:", error.message);
  }
  
  // Check MAW role on relics
  console.log("\n🔍 Checking MAW role...");
  const mawRole = await relics.MAW_ROLE();
  const hasMawRole = await relics.hasRole(mawRole, PROXY_ADDRESS);
  console.log("MAW contract has MAW_ROLE:", hasMawRole);
  
  // Check if relics contract is paused
  const isPaused = await relics.paused();
  console.log("Relics contract paused:", isPaused);
}

main().catch(console.error);