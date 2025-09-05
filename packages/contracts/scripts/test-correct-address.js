const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing with CORRECT deployed address...");
  
  // Use the address from deployments/baseSepolia/MawSacrifice.json
  const correctAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const wrongAddress = "0x15243987458f1ed05b02e6213b532bb060027f4c";
  
  console.log(`✅ Correct address: ${correctAddress}`);
  console.log(`❌ Wrong address: ${wrongAddress}`);
  
  const [deployer] = await ethers.getSigners();
  
  try {
    // Test with correct address
    console.log("\n🧪 Testing with CORRECT address...");
    const correctContract = await ethers.getContractAt("MawSacrificeV4NoTimelock", correctAddress);
    
    const owner = await correctContract.owner();
    console.log(`👑 Owner: ${owner}`);
    
    const nonce = await correctContract.sacrificeNonce();
    console.log(`🔢 Nonce: ${nonce}`);
    
    // Check user balance
    const relicsAddress = await correctContract.relics();
    console.log(`🏺 Relics: ${relicsAddress}`);
    
    const relicsContract = await ethers.getContractAt("Relics", relicsAddress);
    const balance = await relicsContract.balanceOf(deployer.address, 0);
    console.log(`🔑 Keys: ${balance}`);
    
    // Try the sacrifice
    console.log("\n🔥 Attempting sacrifice with CORRECT address...");
    const tx = await correctContract.sacrificeKeys(1);
    const receipt = await tx.wait();
    console.log(`✅ SUCCESS! Transaction: ${receipt.hash}`);
    
  } catch (error) {
    console.log(`❌ Error with correct address: ${error.message}`);
    
    // Also test the wrong address for comparison
    try {
      console.log("\n🔍 For comparison, testing WRONG address...");
      const wrongContract = await ethers.getContractAt("MawSacrificeV4NoTimelock", wrongAddress);
      await wrongContract.sacrificeKeys(1);
    } catch (wrongError) {
      console.log(`❌ Wrong address also fails: ${wrongError.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});