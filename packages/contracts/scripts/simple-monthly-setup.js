const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Simple setup for new cosmetics system...\n");
  
  const NEW_MAW = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const NEW_COSMETICS = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const DEMONS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  const CULTISTS = "0x2D7cD25A014429282062298d2F712FA7983154B9";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  // Connect to MawSacrifice
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", NEW_MAW);
  
  console.log("=== UPDATE MAW TO POINT TO NEW COSMETICS ===");
  
  try {
    console.log("Getting current gas price...");
    const feeData = await ethers.provider.getFeeData();
    console.log(`Current gas price: ${feeData.gasPrice}`);
    
    console.log("Setting MawSacrifice contracts with higher gas...");
    const tx = await maw.setContracts(
      RELICS,
      NEW_COSMETICS, 
      DEMONS,
      CULTISTS,
      {
        gasLimit: 500000,
        maxFeePerGas: feeData.maxFeePerGas * 2n, // Double the gas price
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 2n
      }
    );
    
    console.log(`📤 Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ MawSacrifice updated! Block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed}`);
    
    // Verify
    const mawCosmetics = await maw.cosmetics();
    console.log(`✅ Verified maw → cosmetics: ${mawCosmetics}`);
    console.log(`✅ Match: ${mawCosmetics.toLowerCase() === NEW_COSMETICS.toLowerCase()}`);
    
    if (mawCosmetics.toLowerCase() === NEW_COSMETICS.toLowerCase()) {
      console.log("\n🎉 SUCCESS! MawSacrifice now points to new cosmetics!");
      console.log("🎯 Ready to test fragment sacrifices!");
    }
    
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    
    if (error.message.includes("replacement transaction underpriced")) {
      console.log("⚠️  Try again in a few minutes when gas price settles");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});