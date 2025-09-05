const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Setting up complete authorization for new cosmetics system...\n");
  
  const NEW_MAW = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const NEW_COSMETICS = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  const RACCOONS = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const DEMONS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  const CULTISTS = "0x2D7cD25A014429282062298d2F712FA7983154B9";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  // Connect to contracts
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", NEW_MAW);
  const cosmetics = await ethers.getContractAt("CosmeticsV2", NEW_COSMETICS);
  
  console.log("=== 1. AUTHORIZE NEW MAW IN NEW COSMETICS ===");
  
  try {
    console.log("Setting up cosmetics authorization...");
    const tx1 = await cosmetics.setContracts(RACCOONS, NEW_MAW, {
      gasLimit: 200000
    });
    await tx1.wait();
    console.log(`✅ Cosmetics authorization set! Transaction: ${tx1.hash}`);
    
    // Verify
    const authorizedMaw = await cosmetics.mawSacrifice();
    console.log(`✅ Verified cosmetics → maw: ${authorizedMaw}`);
    console.log(`✅ Match: ${authorizedMaw.toLowerCase() === NEW_MAW.toLowerCase()}`);
    
  } catch (error) {
    console.log(`❌ Failed to authorize cosmetics: ${error.message}`);
  }
  
  console.log("\n=== 2. SET NEW COSMETICS IN MAW ===");
  
  try {
    console.log("Setting up MawSacrifice to point to new cosmetics...");
    const tx2 = await maw.setContracts(
      RELICS,
      NEW_COSMETICS, 
      DEMONS,
      CULTISTS,
      {
        gasLimit: 300000
      }
    );
    await tx2.wait();
    console.log(`✅ MawSacrifice contracts updated! Transaction: ${tx2.hash}`);
    
    // Verify
    const mawCosmetics = await maw.cosmetics();
    console.log(`✅ Verified maw → cosmetics: ${mawCosmetics}`);
    console.log(`✅ Match: ${mawCosmetics.toLowerCase() === NEW_COSMETICS.toLowerCase()}`);
    
  } catch (error) {
    console.log(`❌ Failed to update MawSacrifice: ${error.message}`);
  }
  
  console.log("\n=== 3. FINAL SYSTEM CHECK ===");
  
  try {
    const mawCosmetics = await maw.cosmetics();
    const cosmeticsMaw = await cosmetics.mawSacrifice();
    const mawOwner = await maw.owner();
    const cosmeticsOwner = await cosmetics.owner();
    
    console.log(`🎯 MawSacrifice → Cosmetics: ${mawCosmetics}`);
    console.log(`🎯 Cosmetics → MawSacrifice: ${cosmeticsMaw}`);
    console.log(`👑 MawSacrifice owner: ${mawOwner}`);
    console.log(`👑 Cosmetics owner: ${cosmeticsOwner}`);
    
    const bothMatch = (
      mawCosmetics.toLowerCase() === NEW_COSMETICS.toLowerCase() &&
      cosmeticsMaw.toLowerCase() === NEW_MAW.toLowerCase()
    );
    
    if (bothMatch) {
      console.log("\n🎉 SUCCESS! Both contracts properly configured!");
      console.log("✅ MawSacrifice points to new Cosmetics");  
      console.log("✅ Cosmetics authorizes new MawSacrifice");
      console.log("🎯 Ready to test fragment sacrifices!");
    } else {
      console.log("\n⚠️  Configuration incomplete:");
      console.log(`   Expected Cosmetics: ${NEW_COSMETICS}`);
      console.log(`   Expected MawSacrifice: ${NEW_MAW}`);
    }
    
  } catch (error) {
    console.log(`❌ Final check failed: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});