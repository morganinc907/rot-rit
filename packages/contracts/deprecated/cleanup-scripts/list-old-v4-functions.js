const hre = require("hardhat");

async function main() {
  console.log("🔍 Listing functions available on old V4 contract...");
  
  try {
    // Get the contract artifact to see available functions
    const artifact = await hre.artifacts.readArtifact("MawSacrificeV4Upgradeable");
    
    console.log("\n📋 Available functions:");
    const functions = artifact.abi
      .filter(item => item.type === 'function')
      .map(func => {
        const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
        return `${func.name}(${inputs})`;
      });
    
    functions.sort().forEach((func, index) => {
      console.log(`${index + 1}. ${func}`);
    });
    
    // Look for cosmetics-related functions
    console.log("\n🎨 Cosmetics-related functions:");
    const cosmeticsFunctions = functions.filter(func => 
      func.toLowerCase().includes('cosmetic') || 
      func.toLowerCase().includes('contract')
    );
    
    cosmeticsFunctions.forEach(func => console.log(`- ${func}`));
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});