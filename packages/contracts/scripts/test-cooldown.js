const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing cooldown enforcement...");
  
  const [deployer] = await ethers.getSigners();
  const mawAddress = "0x15243987458f1ed05b02e6213b532bb060027f4c";
  const contract = await ethers.getContractAt("MawSacrificeV4NoTimelock", mawAddress);
  
  try {
    // Make first sacrifice
    console.log("🔥 Attempting first sacrifice...");
    const tx1 = await contract.sacrificeKeys(1);
    const receipt1 = await tx1.wait();
    console.log(`✅ First sacrifice successful in block ${receipt1.blockNumber}`);
    
    // Immediately try second sacrifice (should fail due to cooldown)
    console.log("🔥 Attempting second sacrifice immediately...");
    const tx2 = await contract.sacrificeKeys(1);
    const receipt2 = await tx2.wait();
    console.log(`⚠️  Second sacrifice also succeeded in block ${receipt2.blockNumber}!`);
    console.log("❌ PROBLEM: Cooldown is not working - both transactions succeeded!");
    
  } catch (error) {
    if (error.message.includes("CooldownActive")) {
      console.log("✅ GOOD: Second sacrifice was blocked by cooldown!");
      console.log(`   Error: ${error.message}`);
    } else {
      console.error("❌ Unexpected error:", error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});