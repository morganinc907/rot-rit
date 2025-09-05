const hre = require("hardhat");

async function main() {
  console.log('🔍 Basic cosmetics contract check...');
  
  const [signer] = await hre.ethers.getSigners();
  const cosmeticsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  try {
    // Try different contract interfaces
    const possibleContracts = [
      'CosmeticsV2',
      'Cosmetics', 
      'ERC1155',
    ];
    
    let workingContract = null;
    
    for (const contractName of possibleContracts) {
      try {
        console.log(`\n🔄 Trying ${contractName} interface...`);
        const contract = await hre.ethers.getContractAt(contractName, cosmeticsAddress);
        
        // Test basic functionality
        const owner = await contract.owner();
        console.log(`   ✅ ${contractName} works! Owner: ${owner}`);
        
        workingContract = { contract, name: contractName };
        break;
      } catch (e) {
        console.log(`   ❌ ${contractName} failed: ${e.message.slice(0, 50)}...`);
      }
    }
    
    if (!workingContract) {
      console.log('\n❌ No working contract interface found');
      return;
    }
    
    const contract = workingContract.contract;
    console.log(`\n🎯 Using ${workingContract.name} interface`);
    
    // Check basic properties
    try {
      const baseTypeURI = await contract.baseTypeURI();
      console.log('Base Type URI:', baseTypeURI);
    } catch (e) {
      console.log('No baseTypeURI method');
    }
    
    try {
      const currentSetId = await contract.currentMonthlySetId();
      console.log('Current Monthly Set ID:', currentSetId.toString());
    } catch (e) {
      console.log('No currentMonthlySetId method');
    }
    
    // Try to find cosmetics by checking if specific IDs exist
    console.log('\n🎭 Checking specific cosmetic IDs...');
    
    // Check common cosmetic type patterns
    const commonIds = [1, 2, 3, 4, 5, 10, 20, 50, 100, 101, 102, 103, 104, 105];
    
    for (const id of commonIds) {
      try {
        const exists = await contract.typeExists(id);
        if (exists) {
          console.log(`   ✅ ID ${id} exists!`);
          
          try {
            const info = await contract.getCosmeticInfo(id);
            console.log(`     Name: ${info.name}`);
            console.log(`     Active: ${info.active}`);
            console.log(`     Supply: ${info.currentSupply}/${info.maxSupply}`);
            console.log(`     Image: ${info.imageURI}`);
          } catch (e) {
            console.log(`     (Could not get info: ${e.message.slice(0, 30)}...)`);
          }
        }
      } catch (e) {
        // ID doesn't exist or error
      }
    }
    
    // Check deployment history or addresses file for clues
    console.log('\n📂 Checking for deployment addresses...');
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Check if there's an addresses.json file
      const addressesPath = path.join(__dirname, '..', 'addresses.json');
      if (fs.existsSync(addressesPath)) {
        const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
        console.log('📋 Found addresses.json:');
        Object.entries(addresses).forEach(([key, value]) => {
          if (key.toLowerCase().includes('cosmetic')) {
            console.log(`   ${key}: ${value}`);
          }
        });
      }
      
      // Check deployments directory
      const deploymentsPath = path.join(__dirname, '..', 'deployments');
      if (fs.existsSync(deploymentsPath)) {
        const files = fs.readdirSync(deploymentsPath);
        console.log('📂 Deployment files:', files.filter(f => f.includes('cosmetic') || f.includes('Cosmetic')));
      }
      
    } catch (e) {
      console.log('No addresses file found');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});