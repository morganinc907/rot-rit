/**
 * Post-Deploy Script - Auto-generate addresses and ABIs
 * 
 * This script extracts all deployed contract addresses and ABIs from artifacts,
 * then generates the packages that the frontend consumes.
 * 
 * Usage: node scripts/postDeploy.js
 */

const { promises: fs } = require('fs');
const path = require('path');

// Current Base Sepolia deployed addresses
const BASE_SEPOLIA_ADDRESSES = {
  Relics: "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b",
  Raccoons: "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f", 
  Cultists: "0x2D7cD25A014429282062298d2F712FA7983154B9",
  Demons: "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF",
  Cosmetics: "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A",
  KeyShop: "0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6",
  MawSacrifice: "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083", // V4 Dev (RNG fixed)
  RaccoonRenderer: "0x3eE467d8Dc8Fdf26dFC17dA8630EE1078aEd3A85",
  RitualReadAggregator: "0xe14830B91Bf666E51305a89C1196d0e88bad98a2"
};

// Contract name mappings (artifact name -> canonical name)
const CONTRACT_MAPPINGS = {
  "MawSacrificeV3": "MawSacrifice",
  "MawSacrificeV4Upgradeable": "MawSacrifice", // Use V4 ABI
  "MawSacrificeV4Dev": "MawSacrifice", // Use Dev ABI
  "CosmeticsV2": "Cosmetics" // If we have versioned artifacts
};

async function main() {
  console.log("🚀 Post-deployment: Generating addresses and ABIs...\n");

  // Step 1: Create deployment JSONs
  await createDeploymentJSONs();
  
  // Step 2: Generate packages
  await generatePackages();
  
  console.log("✅ Post-deployment complete!");
  console.log("📦 Generated packages:");
  console.log("   - packages/addresses/");
  console.log("   - packages/abis/"); 
  console.log("📱 Frontend can now import from these packages");
}

async function createDeploymentJSONs() {
  console.log("📋 Creating deployment JSONs...");
  
  const deployDir = path.resolve(__dirname, '../deployments/baseSepolia');
  await fs.mkdir(deployDir, { recursive: true });
  
  // Create deployment JSON for each contract
  for (const [contractName, address] of Object.entries(BASE_SEPOLIA_ADDRESSES)) {
    try {
      // Find the artifact file (handle versioned contracts)
      const artifactName = getArtifactName(contractName);
      const artifactPath = path.resolve(__dirname, `../artifacts/contracts/${artifactName}.sol/${artifactName}.json`);
      
      let abi = [];
      try {
        const artifact = JSON.parse(await fs.readFile(artifactPath, 'utf8'));
        abi = artifact.abi;
      } catch (error) {
        console.warn(`⚠️  Could not load ABI for ${contractName}: ${error.message}`);
      }
      
      const deployment = {
        address,
        abi,
        deployedAt: new Date().toISOString(),
        version: "1.0.0",
        chainId: 84532
      };
      
      const deployFile = path.join(deployDir, `${contractName}.json`);
      await fs.writeFile(deployFile, JSON.stringify(deployment, null, 2));
      console.log(`   ✅ ${contractName} -> ${deployFile}`);
      
    } catch (error) {
      console.error(`   ❌ Failed to create deployment for ${contractName}:`, error.message);
    }
  }
}

async function generatePackages() {
  console.log("\n📦 Generating packages...");
  
  // Read all deployment files
  const deployDir = path.resolve(__dirname, '../deployments/baseSepolia');
  const deployFiles = await fs.readdir(deployDir);
  
  const addresses = {};
  const abis = {};
  
  for (const file of deployFiles) {
    if (!file.endsWith('.json')) continue;
    
    const contractName = path.basename(file, '.json');
    const deployPath = path.join(deployDir, file);
    const deployment = JSON.parse(await fs.readFile(deployPath, 'utf8'));
    
    addresses[contractName] = deployment.address;
    abis[contractName] = deployment.abi;
  }
  
  // Generate addresses package
  await generateAddressesPackage({ baseSepolia: addresses });
  
  // Generate ABIs package  
  await generateABIsPackage(abis);
  
  console.log("   ✅ All packages generated");
}

async function generateAddressesPackage(addressesByChain) {
  const addressesDir = path.resolve(__dirname, '../../addresses');
  await fs.mkdir(addressesDir, { recursive: true });
  
  // Write JSON file
  const jsonPath = path.join(addressesDir, 'addresses.json');
  await fs.writeFile(jsonPath, JSON.stringify(addressesByChain, null, 2));
  
  // Write typed TypeScript index
  const tsPath = path.join(addressesDir, 'index.ts');
  const tsContent = `/* auto-generated */
export const addresses = ${JSON.stringify(addressesByChain, null, 2)} as const;

export type Chains = keyof typeof addresses;
export type ContractsOf<C extends Chains> = keyof typeof addresses[C];

export function getAddress<C extends Chains>(chain: C, name: ContractsOf<C>) {
  return addresses[chain][name];
}

// Convenience exports for Base Sepolia
export const baseSepolia = addresses.baseSepolia;
`;
  
  await fs.writeFile(tsPath, tsContent);
  console.log(`   📍 Addresses package: ${addressesDir}`);
}

async function generateABIsPackage(abis) {
  const abisDir = path.resolve(__dirname, '../../abis');
  await fs.mkdir(abisDir, { recursive: true });
  
  // Write master JSON file
  const jsonPath = path.join(abisDir, 'index.json');
  await fs.writeFile(jsonPath, JSON.stringify(abis, null, 2));
  
  // Write individual ABI files
  for (const [contractName, abi] of Object.entries(abis)) {
    const abiPath = path.join(abisDir, `${contractName}.json`);
    await fs.writeFile(abiPath, JSON.stringify(abi, null, 2));
  }
  
  // Write TypeScript index
  const tsPath = path.join(abisDir, 'index.ts');
  const exports = Object.keys(abis)
    .map(name => `import ${name}ABI from './${name}.json';`)
    .join('\n');
    
  const tsContent = `/* auto-generated */
${exports}

export const abis = {
${Object.keys(abis).map(name => `  ${name}: ${name}ABI,`).join('\n')}
} as const;

export type ContractName = keyof typeof abis;
export type ABI<T extends ContractName> = typeof abis[T];

// Individual exports
${Object.keys(abis).map(name => `export { default as ${name}ABI } from './${name}.json';`).join('\n')}
`;
  
  await fs.writeFile(tsPath, tsContent);
  console.log(`   🔧 ABIs package: ${abisDir}`);
}

function getArtifactName(contractName) {
  // Handle versioned contracts
  if (contractName === "MawSacrifice") return "MawSacrificeV4Dev"; // Use Dev ABI with RNG fix
  if (contractName === "Cosmetics") return "CosmeticsV2";
  return contractName;
}

// Handle different execution contexts
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Post-deploy failed:", error);
    process.exit(1);
  });
}

module.exports = { main };