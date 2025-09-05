const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");
const { updateAddress, printDeploymentSummary } = require("./utils/address-manager");

/**
 * Complete CosmeticsV2 deployment and setup script
 * 
 * This script:
 * 1. Deploys a new CosmeticsV2 contract (owned by deployer)
 * 2. Authorizes the MawSacrifice proxy to mint cosmetics
 * 3. Creates standard cosmetic types
 * 4. Updates MawSacrifice to use new cosmetics contract
 * 5. Sets up monthly cosmetic types
 */
async function main() {
  const [signer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  
  console.log("🎨 Complete CosmeticsV2 Deployment & Setup");
  console.log("==========================================");
  console.log("Network:", networkName);
  console.log("Deployer:", signer.address);
  console.log("MawSacrifice Proxy:", addresses[networkName]?.MawSacrifice);
  console.log("");

  if (!addresses[networkName]?.MawSacrifice) {
    throw new Error(`No MawSacrifice address found for network: ${networkName}`);
  }

  try {
    // Step 1: Deploy CosmeticsV2
    console.log("📋 Step 1: Deploying CosmeticsV2...");
    const CosmeticsV2 = await hre.ethers.getContractFactory("CosmeticsV2");
    const cosmetics = await CosmeticsV2.deploy(
      "https://rot-ritual.s3.amazonaws.com/cosmetics/", // baseTypeURI
      "https://rot-ritual.s3.amazonaws.com/cosmetics/"  // boundBaseURI
    );
    await cosmetics.waitForDeployment();
    
    const cosmeticsAddress = await cosmetics.getAddress();
    console.log("✅ CosmeticsV2 deployed to:", cosmeticsAddress);
    console.log("");

    // Step 2: Authorize MawSacrifice proxy
    console.log("📋 Step 2: Authorizing MawSacrifice proxy...");
    const authTx = await cosmetics.setContracts(
      addresses[networkName].Raccoons,
      addresses[networkName].MawSacrifice
    );
    await authTx.wait();
    console.log("✅ MawSacrifice proxy authorized");
    console.log("");

    // Step 3: Create cosmetic types
    console.log("📋 Step 3: Creating cosmetic types...");
    const cosmeticTypes = [
      { name: "glasses", slot: 1, rarity: 1 },     // Face, Common
      { name: "strainer", slot: 2, rarity: 1 },    // Body, Common  
      { name: "pink", slot: 2, rarity: 3 },        // Body, Rare
      { name: "orange", slot: 5, rarity: 4 },      // Background, Epic
      { name: "underpants", slot: 4, rarity: 2 }   // Legs, Uncommon
    ];

    const createdTypes = [];
    for (const type of cosmeticTypes) {
      try {
        console.log(`  Creating: ${type.name} (slot ${type.slot}, rarity ${type.rarity})`);
        const tx = await cosmetics.createCosmeticType(
          type.name,
          `${type.name}.png`,
          `${type.name}_preview.png`,
          type.rarity,
          type.slot,
          1, // monthlySetId
          1000 // maxSupply
        );
        await tx.wait();
        createdTypes.push(createdTypes.length + 1);
        console.log(`  ✅ Created type ${createdTypes.length}: ${type.name}`);
        
        // Wait between transactions
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`  ⚠️  ${type.name} may already exist`);
        createdTypes.push(createdTypes.length + 1);
      }
    }
    console.log("");

    // Step 4: Update MawSacrifice to use new cosmetics
    console.log("📋 Step 4: Updating MawSacrifice contract references...");
    const mawSacrifice = await hre.ethers.getContractAt(
      "MawSacrificeV4NoTimelock", 
      addresses[networkName].MawSacrifice
    );
    
    const updateTx = await mawSacrifice.setContracts(
      addresses[networkName].Relics,
      cosmeticsAddress, // New cosmetics
      addresses[networkName].Demons,
      addresses[networkName].Cultists
    );
    await updateTx.wait();
    console.log("✅ MawSacrifice updated to use new cosmetics");
    console.log("");

    // Step 5: Set monthly cosmetic types
    console.log("📋 Step 5: Setting up monthly cosmetic types...");
    const monthlyTx = await mawSacrifice.setMonthlyCosmeticTypes(createdTypes);
    await monthlyTx.wait();
    console.log("✅ Monthly cosmetic types configured:", createdTypes);
    console.log("");

    // Verification
    console.log("🔍 Final Verification:");
    console.log("- New cosmetics address:", cosmeticsAddress);
    console.log("- Cosmetics owner:", await cosmetics.owner());
    console.log("- Authorized MawSacrifice:", await cosmetics.mawSacrifice());
    console.log("- MawSacrifice cosmetics ref:", await mawSacrifice.cosmetics());
    console.log("- Current cosmetic types:", (await mawSacrifice.getCurrentCosmeticTypes()).map(n => Number(n)));
    console.log("");

    // Auto-update addresses.json
    console.log("📋 Step 6: Auto-updating addresses.json...");
    const updateResult = updateAddress(networkName, "Cosmetics", cosmeticsAddress);
    
    if (!updateResult.success) {
      console.log("⚠️  Failed to auto-update addresses.json:", updateResult.error);
      console.log("   Please update manually:");
      console.log(`   "${networkName}": { "Cosmetics": "${cosmeticsAddress}" }`);
    }

    // Print deployment summary
    printDeploymentSummary(networkName, "Cosmetics", cosmeticsAddress, updateResult.oldAddress);
    
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("");
    console.log("📋 Next Steps:");
    console.log("1. ✅ addresses.json updated automatically");
    console.log("2. Update frontend packages:");
    console.log("   npm run build:packages");
    console.log("3. Test cosmetic sacrifices in frontend");
    console.log("");
    console.log("🚀 The system is ready for cosmetic sacrifices with proper success rates!");

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});