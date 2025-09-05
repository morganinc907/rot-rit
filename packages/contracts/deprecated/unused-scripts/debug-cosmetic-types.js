/**
 * Debug cosmetic types in the cosmetics contract
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🎨 Debugging cosmetic types...\n');
  
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Using account:', signer.address);
    
    // Use direct ABI for cosmetics
    const cosmeticsAbi = [
      "function typeExists(uint256 typeId) view returns (bool)",
      "function cosmeticTypes(uint256 typeId) view returns (tuple(string name, string description, string imageURI, uint8 slot, uint8 rarity, uint256 maxSupply, uint256 currentSupply, bool active, bool unlimited))",
      "function owner() view returns (address)"
    ];
    
    const cosmetics = new ethers.Contract(COSMETICS_ADDRESS, cosmeticsAbi, signer);
    const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", MAW_ADDRESS);
    
    console.log('🏭 Cosmetics contract:', COSMETICS_ADDRESS);
    console.log('🤖 Maw contract:', MAW_ADDRESS);
    
    // Check what types Maw thinks are available
    console.log('\n1️⃣ Checking Maw\'s cosmetic types...');
    try {
      const mawTypes = await maw.getCurrentCosmeticTypes();
      console.log('🎯 Maw configured types:', mawTypes.map(t => t.toString()));
    } catch (e) {
      console.log('❌ Cannot read Maw types:', e.message);
    }
    
    // Check if these types actually exist in cosmetics contract
    console.log('\n2️⃣ Checking cosmetics contract types...');
    const typesToCheck = [1, 2, 3, 4, 5];
    
    for (const typeId of typesToCheck) {
      try {
        const exists = await cosmetics.typeExists(typeId);
        console.log(`🎨 Type ${typeId}:`);
        console.log(`   Exists: ${exists}`);
        
        if (exists) {
          try {
            const typeInfo = await cosmetics.cosmeticTypes(typeId);
            console.log(`   Name: "${typeInfo.name}"`);
            console.log(`   Active: ${typeInfo.active}`);
            console.log(`   Supply: ${typeInfo.currentSupply}/${typeInfo.maxSupply}`);
            console.log(`   Rarity: ${typeInfo.rarity}`);
            console.log(`   Slot: ${typeInfo.slot}`);
          } catch (e) {
            console.log(`   ⚠️ Cannot read type info: ${e.message}`);
          }
        } else {
          console.log(`   ❌ TYPE ${typeId} DOES NOT EXIST!`);
        }
        
      } catch (e) {
        console.log(`❌ Cannot check type ${typeId}:`, e.message);
      }
    }
    
    // Check ownership
    console.log('\n3️⃣ Checking cosmetics ownership...');
    try {
      const owner = await cosmetics.owner();
      console.log('👑 Cosmetics owner:', owner);
      console.log('🤖 Maw address:', MAW_ADDRESS);
      console.log('✅ Maw owns cosmetics:', owner.toLowerCase() === MAW_ADDRESS.toLowerCase());
    } catch (e) {
      console.log('❌ Cannot check ownership');
    }
    
    console.log('\n🎯 Diagnosis:');
    console.log('If types 1-5 don\'t exist in cosmetics contract,');
    console.log('that explains why mintTo() fails and no cosmetics are minted!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

main().catch(console.error);