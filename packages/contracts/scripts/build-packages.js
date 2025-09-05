/**
 * Build Packages Script - Generate addresses and ABIs for frontend
 * 
 * This script generates the packages that the frontend consumes:
 * - addresses.json (already exists)
 * - ABIs from compiled artifacts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("📦 Building packages for frontend...");
  console.log("");

  try {
    // Read current addresses
    const addressesPath = path.join(__dirname, '../../addresses/addresses.json');
    const addresses = JSON.parse(await fs.readFile(addressesPath, 'utf8'));
    
    console.log("✅ Addresses package already up to date");
    console.log("   Location: packages/addresses/addresses.json");
    
    // Show current addresses
    if (addresses.baseSepolia) {
      console.log("");
      console.log("🔍 Current Base Sepolia addresses:");
      Object.entries(addresses.baseSepolia).forEach(([name, address]) => {
        console.log(`   ${name}: ${address}`);
      });
    }

    console.log("");
    console.log("📋 ABIs:");
    
    // Generate ABIs from artifacts
    const artifactsPath = path.join(__dirname, '../artifacts/contracts');
    const abisPath = path.join(__dirname, '../../abis');
    
    // Ensure ABIs directory exists
    await fs.mkdir(abisPath, { recursive: true });
    
    // Contract files to extract ABIs from
    const contractFiles = [
      'MawSacrificeV4NoTimelock.sol/MawSacrificeV4NoTimelock.json',
      'CosmeticsV2.sol/CosmeticsV2.json',
      'Relics.sol/Relics.json',
      'Demons.sol/Demons.json',
      'Cultists.sol/Cultists.json',
      'KeyShop.sol/KeyShop.json',
      'Raccoons.sol/Raccoons.json',
      'RaccoonRenderer.sol/RaccoonRenderer.json'
    ];

    let generatedABIs = 0;

    for (const contractFile of contractFiles) {
      try {
        const artifactPath = path.join(artifactsPath, contractFile);
        const artifact = JSON.parse(await fs.readFile(artifactPath, 'utf8'));
        
        // Extract contract name
        const contractName = path.basename(contractFile, '.json');
        
        // Write ABI file
        const abiPath = path.join(abisPath, `${contractName}.json`);
        await fs.writeFile(abiPath, JSON.stringify(artifact.abi, null, 2));
        
        console.log(`   ✅ Generated ${contractName}.json`);
        generatedABIs++;
      } catch (error) {
        const contractName = path.basename(contractFile, '.json');
        console.log(`   ⚠️  Could not generate ${contractName}.json: ${error.message}`);
      }
    }

    console.log("");
    console.log(`📊 Package Build Summary:`);
    console.log(`   - Addresses: ✅ Ready`);
    console.log(`   - ABIs: ${generatedABIs} files generated`);
    console.log("");
    console.log("🎉 Package build complete!");
    console.log("   Frontend can now access updated addresses and ABIs");

  } catch (error) {
    console.error("❌ Package build failed:", error.message);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});