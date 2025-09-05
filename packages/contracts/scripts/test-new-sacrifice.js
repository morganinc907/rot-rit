const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing new MawSacrifice fragment sacrifice...\n");
  
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const NEW_COSMETICS = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  // Connect to contracts
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", NEW_MAW);
  const cosmetics = await ethers.getContractAt("CosmeticsV2", NEW_COSMETICS);
  const relics = await ethers.getContractAt("Relics", RELICS);
  
  try {
    console.log("=== CONTRACT CONFIGURATION CHECK ===");
    
    // Check MawSacrifice configuration
    const mawCosmetics = await maw.cosmetics();
    const mawRelics = await maw.relics();
    console.log(`🎯 MawSacrifice → Cosmetics: ${mawCosmetics}`);
    console.log(`🎯 MawSacrifice → Relics: ${mawRelics}`);
    console.log(`✅ Cosmetics match: ${mawCosmetics.toLowerCase() === NEW_COSMETICS.toLowerCase()}`);
    console.log(`✅ Relics match: ${mawRelics.toLowerCase() === RELICS.toLowerCase()}`);
    
    // Check Cosmetics configuration
    const cosmeticsMaw = await cosmetics.mawSacrifice();
    console.log(`🎯 Cosmetics → MawSacrifice: ${cosmeticsMaw}`);
    console.log(`✅ MawSacrifice match: ${cosmeticsMaw.toLowerCase() === NEW_MAW.toLowerCase()}`);
    
    console.log("\n=== USER BALANCE CHECK ===");
    
    // Check user's fragment balance
    const fragmentId = 1; // Fragment token ID
    const fragmentBalance = await relics.balanceOf(signer.address, fragmentId);
    console.log(`🧩 Fragment balance: ${fragmentBalance}`);
    
    if (fragmentBalance === 0n) {
      console.log("⚠️  No fragments to sacrifice! Need to mint some fragments first.");
      return;
    }
    
    console.log("\n=== APPROVAL CHECK ===");
    
    // Check if MawSacrifice is approved to burn fragments
    const isApproved = await relics.isApprovedForAll(signer.address, NEW_MAW);
    console.log(`🔑 Is MawSacrifice approved: ${isApproved}`);
    
    if (!isApproved) {
      console.log("🔑 Approving MawSacrifice to manage fragments...");
      const approveTx = await relics.setApprovalForAll(NEW_MAW, true, {
        gasLimit: 100000
      });
      await approveTx.wait();
      console.log(`✅ Approval granted! Transaction: ${approveTx.hash}`);
    }
    
    console.log("\n=== SACRIFICE TEST ===");
    
    // Test sacrificing 1 fragment + 0 masks
    console.log("🔥 Attempting to sacrifice 1 fragment + 0 masks...");
    const sacrificeTx = await maw.sacrificeForCosmetic(1, 0, {
      gasLimit: 500000
    });
    
    console.log(`📤 Sacrifice transaction sent: ${sacrificeTx.hash}`);
    const receipt = await sacrificeTx.wait();
    console.log(`✅ Sacrifice successful! Block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed}`);
    
    // Check for cosmetic minting events
    const cosmeticMintEvents = receipt.logs.filter(log => {
      try {
        const parsedLog = cosmetics.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        return parsedLog && parsedLog.name === 'TransferSingle';
      } catch {
        return false;
      }
    });
    
    if (cosmeticMintEvents.length > 0) {
      console.log(`🎨 Cosmetic minted! Found ${cosmeticMintEvents.length} mint event(s)`);
      cosmeticMintEvents.forEach((event, i) => {
        const parsed = cosmetics.interface.parseLog({
          topics: event.topics,
          data: event.data
        });
        console.log(`   Event ${i+1}: ID ${parsed.args.id}, Amount ${parsed.args.value}`);
      });
    } else {
      console.log("⚠️  No cosmetic minting events found");
    }
    
    console.log("\n🎉 Test completed!");
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    
    if (error.message.includes("execution reverted")) {
      console.log("💡 This might be due to missing MAW_ROLE authorization");
      console.log("   Try running the role management script");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});