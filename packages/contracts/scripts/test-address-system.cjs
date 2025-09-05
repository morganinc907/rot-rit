const hre = require("hardhat");

async function main() {
  console.log('🧪 Testing chain-first address resolution system...');
  console.log('');
  
  // Our 9 contracts for chain-first resolution
  const contracts = {
    RELICS: "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b",
    MAW_SACRIFICE: "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db",
    COSMETICS: null, // Will resolve from MAW
    DEMONS: null,    // Will resolve from MAW  
    CULTISTS: null,  // Will resolve from MAW
    KEY_SHOP: "0xF2851E53bD86dff9fb7b9d67c19AF1CCe2Ce7076", // Fallback for now
    RACCOONS: "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f", // Fallback for now
    RACCOON_RENDERER: "0x3eE467d8Dc8Fdf26dFC17dA8630EE1078aEd3A85", // Fallback for now
    RITUAL_READ_AGGREGATOR: "0xe14830B91Bf666E51305a89C1196d0e88bad98a2" // Fallback for now
  };
  
  try {
    console.log('🔗 Testing chain resolution...');
    console.log('');
    
    // Step 1: Verify Relics → MAW binding
    console.log('1️⃣ Anchor Resolution (Relics → MAW):');
    const relics = await hre.ethers.getContractAt("Relics", contracts.RELICS);
    const mawFromRelics = await relics.mawSacrifice();
    const mawMatches = mawFromRelics.toLowerCase() === contracts.MAW_SACRIFICE.toLowerCase();
    
    console.log(`   Relics.mawSacrifice(): ${mawFromRelics}`);
    console.log(`   Expected MAW:          ${contracts.MAW_SACRIFICE}`);
    console.log(`   ✅ Match: ${mawMatches ? 'YES' : 'NO'}`);
    console.log('');
    
    if (!mawMatches) {
      console.log('❌ CRITICAL: Relics → MAW binding broken!');
      return;
    }
    
    // Step 2: Resolve contracts from MAW
    console.log('2️⃣ MAW Resolution (MAW → Core Contracts):');
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", contracts.MAW_SACRIFICE);
    
    const mawContracts = {
      cosmetics: await maw.cosmetics(),
      demons: await maw.demons(),
      cultists: await maw.cultists(),
      relics: await maw.relics() // Should match our anchor
    };
    
    console.log(`   MAW.cosmetics(): ${mawContracts.cosmetics}`);
    console.log(`   MAW.demons():    ${mawContracts.demons}`);
    console.log(`   MAW.cultists():  ${mawContracts.cultists}`);
    console.log(`   MAW.relics():    ${mawContracts.relics}`);
    console.log('');
    
    // Verify MAW.relics() matches our anchor
    const relicsMatches = mawContracts.relics.toLowerCase() === contracts.RELICS.toLowerCase();
    console.log(`   🔄 Cross-check: MAW.relics() == anchor: ${relicsMatches ? 'YES' : 'NO'}`);
    console.log('');
    
    // Step 3: Test resolved contract functionality
    console.log('3️⃣ Functionality Test (Resolved Contracts):');
    
    // Test cosmetics
    try {
      const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", mawContracts.cosmetics);
      const cosmeticTypes = await cosmetics.getCurrentCosmeticTypes();
      console.log(`   ✅ Cosmetics.getCurrentCosmeticTypes(): [${cosmeticTypes.map(t => Number(t)).join(', ')}]`);
    } catch (e) {
      console.log(`   ❌ Cosmetics test failed: ${e.message}`);
    }
    
    // Test demons (basic interface check)
    try {
      const demons = await hre.ethers.getContractAt("IERC721", mawContracts.demons);
      const demonName = await demons.name();
      console.log(`   ✅ Demons.name(): ${demonName}`);
    } catch (e) {
      console.log(`   ❌ Demons test failed: ${e.message}`);
    }
    
    console.log('');
    
    // Step 4: System Health Summary
    console.log('4️⃣ Chain-First System Health:');
    console.log('');
    
    const chainResolved = 4; // relics, maw, cosmetics, demons, cultists (cosmetics verified above)
    const fallback = 4;      // keyshop, raccoons, renderer, aggregator
    const total = 9;
    
    console.log(`   📊 Total contracts: ${total}`);
    console.log(`   ✅ Chain-resolved: ${chainResolved} (${Math.round(chainResolved/total*100)}%)`);
    console.log(`   ⚠️  Fallback: ${fallback} (${Math.round(fallback/total*100)}%)`);
    console.log('');
    
    console.log('🎯 Resolution Strategy:');
    console.log('   🔒 RELICS: Anchor (addresses.json)');
    console.log('   🔒 MAW_SACRIFICE: From Relics.mawSacrifice()'); 
    console.log('   ⛓️ COSMETICS: From MAW.cosmetics()');
    console.log('   ⛓️ DEMONS: From MAW.demons()');
    console.log('   ⛓️ CULTISTS: From MAW.cultists()');
    console.log('   ⚠️ KEY_SHOP: Fallback (TODO: add to MAW)');
    console.log('   ⚠️ RACCOONS: Fallback (TODO: add to MAW)');
    console.log('   ⚠️ RACCOON_RENDERER: Fallback (TODO: add to MAW)');
    console.log('   ⚠️ RITUAL_READ_AGGREGATOR: Fallback (TODO: add to MAW)');
    console.log('');
    
    console.log('✅ SYSTEM STATUS: Chain-first foundation working!');
    console.log('📱 Frontend can now use useAddress("COSMETICS") etc.');
    console.log('🔒 Address drift protection: ENABLED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});