const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const DEMON_CONFIG_PATH = path.join(__dirname, '../config/demon-traits.json');
const CONTRACTS_PATH = path.join(__dirname, '../../packages/contracts');

class ContractTraitSetup {
  constructor() {
    this.demonConfig = JSON.parse(fs.readFileSync(DEMON_CONFIG_PATH, 'utf8'));
  }

  async generateSetupScript() {
    console.log(chalk.cyan('\n🔧 Generating contract trait setup script...\n'));

    const script = this.buildHardhatScript();
    
    const outputPath = path.join(CONTRACTS_PATH, 'scripts/setup-demon-traits.js');
    await fs.writeFile(outputPath, script);
    
    console.log(chalk.green('✅ Contract setup script generated!'));
    console.log(chalk.gray(`Script saved to: ${outputPath}`));
    console.log(chalk.yellow('\nTo use: npx hardhat run scripts/setup-demon-traits.js --network baseSepolia'));
  }

  buildHardhatScript() {
    return `const hre = require("hardhat");

async function main() {
  console.log("🔧 Setting up Demon contract traits...");

  const demonsAddress = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF"; // Update with actual address
  const demons = await hre.ethers.getContractAt("Demons", demonsAddress);

  // Trait data from generated config
  const traitData = ${JSON.stringify(this.processTraitData(), null, 2)};

  // Set trait data for each trait type
  for (const [traitType, data] of Object.entries(traitData)) {
    console.log(\`Setting trait data for \${data.displayName}...\`);
    
    const tx = await demons.setTraitData(
      parseInt(traitType),
      data.names,
      data.rarities
    );
    await tx.wait();
    
    console.log(\`✅ \${data.displayName} traits set (\${data.names.length} variants)\`);
  }

  console.log("\\n🎉 All demon traits configured!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });`;
  }

  processTraitData() {
    const traitData = {};
    
    this.demonConfig.rareLayers.forEach((layer, index) => {
      traitData[index] = {
        displayName: layer.displayName,
        names: layer.traits.map(t => t.name),
        rarities: layer.traits.map(t => t.weight * 100) // Convert to out of 10000
      };
    });

    return traitData;
  }
}

// Run setup
const setup = new ContractTraitSetup();
setup.generateSetupScript().catch(console.error);