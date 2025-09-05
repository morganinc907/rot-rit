const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 Testing cosmetics mint directly...");

  const [signer] = await ethers.getSigners();
  
  // Contract addresses
  const devMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const cosmeticsAddress = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  console.log(`Dev Contract: ${devMawAddress}`);
  console.log(`Cosmetics Contract: ${cosmeticsAddress}`);
  
  // Get cosmetics contract
  const cosmetics = await ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  
  console.log("🧪 Testing cosmetics mint authorization...");
  
  // Check what happens if we try to mint directly from our wallet (should fail)
  try {
    await cosmetics.mintTo.staticCall(signer.address, 1);
    console.log("✅ Direct mint succeeded (unexpected)");
  } catch (error) {
    console.log(`❌ Direct mint failed: ${error.reason || error.message}`);
  }
  
  // The key insight: Maybe we need to transfer ownership of cosmetics from old to dev contract
  // Let's do this step by step
  
  console.log("\n🔧 Checking if old MawSacrifice can transfer cosmetics ownership...");
  
  const oldMawAddress = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const oldMaw = await ethers.getContractAt("MawSacrificeV4Upgradeable", oldMawAddress);
  
  // Check if the old contract has functions to manage cosmetics ownership
  try {
    // Let's see what happens if we call updateContracts to point to new addresses
    console.log("📞 Trying to update cosmetics contract reference...");
    const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const demonsAddress = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
    const cultistsAddress = "0x2D7cD25A014429282062298d2F712FA7983154B9";
    
    const tx = await oldMaw.updateContracts(
      relicsAddress,
      devMawAddress, // Point cosmetics reference to dev contract!
      demonsAddress,
      cultistsAddress
    );
    console.log(`Transaction: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Contract references updated!");
    
  } catch (error) {
    console.error(`❌ Failed to update contracts: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });