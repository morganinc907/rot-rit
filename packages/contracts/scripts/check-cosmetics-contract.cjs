const hre = require("hardhat");

async function main() {
  console.log('🔍 Checking cosmetics contract for actual cosmetic types...');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('Signer:', signer.address);
  
  // Get cosmetics contract address from addresses.json or deployment
  const cosmeticsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b"; // From your addresses
  
  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    console.log('\n📋 Cosmetics Contract:', cosmeticsAddress);
    
    // Check what cosmetic types exist
    try {
      console.log('\n🎭 Checking cosmetic types...');
      
      // Try to get cosmetic types - this might be stored as an array or mapping
      for (let i = 0; i < 20; i++) {
        try {
          // Try different ways to get cosmetic info
          const exists = await cosmetics.exists(i);
          if (exists) {
            console.log(`✅ Cosmetic type ${i} exists`);
            
            // Try to get more info about this cosmetic type
            try {
              const uri = await cosmetics.uri(i);
              console.log(`   URI: ${uri}`);
            } catch (e) {
              console.log(`   (No URI method or failed)`);
            }
            
            try {
              const name = await cosmetics.name(i);
              console.log(`   Name: ${name}`);
            } catch (e) {
              // No name method
            }
            
            try {
              const totalSupply = await cosmetics.totalSupply(i);
              console.log(`   Total Supply: ${totalSupply.toString()}`);
            } catch (e) {
              // No totalSupply method
            }
          }
        } catch (e) {
          // This ID doesn't exist or method failed
        }
      }
      
      // Check if there's a way to get all cosmetic types
      try {
        const totalTypes = await cosmetics.totalCosmeticTypes();
        console.log(`\n📊 Total cosmetic types: ${totalTypes.toString()}`);
      } catch (e) {
        console.log('\n⚠️ No totalCosmeticTypes() method');
      }
      
      // Check contract ABI to see what methods are available
      console.log('\n📄 Available contract methods:');
      const fragment = cosmetics.interface.fragments;
      Object.keys(fragment).forEach(key => {
        const func = fragment[key];
        if (func.type === 'function') {
          console.log(`   ${func.name}(${func.inputs.map(i => i.type).join(', ')})`);
        }
      });
      
    } catch (error) {
      console.log('❌ Error checking cosmetic types:', error.message);
    }
    
  } catch (contractError) {
    console.log('❌ Error connecting to cosmetics contract:', contractError.message);
    
    // Try different contract names
    console.log('\n🔄 Trying different contract interfaces...');
    
    const possibleNames = ['Cosmetics', 'CosmeticsV1', 'ERC1155'];
    for (const name of possibleNames) {
      try {
        const contract = await hre.ethers.getContractAt(name, cosmeticsAddress);
        console.log(`✅ Successfully connected with ${name} interface`);
        
        // Try to get basic info
        try {
          const supportsInterface = await contract.supportsInterface('0x01ffc9a7'); // ERC165
          console.log(`   Supports ERC165: ${supportsInterface}`);
        } catch (e) {}
        
        break;
      } catch (e) {
        console.log(`❌ ${name} interface failed`);
      }
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});