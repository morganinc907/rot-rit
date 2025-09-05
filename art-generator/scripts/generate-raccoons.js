const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const chalk = require('chalk');
const ora = require('ora');
const weighted = require('weighted');

const CONFIG_PATH = path.join(__dirname, '../config/raccoon-traits.json');
const LAYERS_PATH = path.join(__dirname, '../layers/raccoons');
const OUTPUT_PATH = path.join(__dirname, '../output/raccoons');

class RaccoonGenerator {
  constructor() {
    this.config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    this.generatedCombinations = new Set();
    this.metadata = [];
  }

  async generate() {
    console.log(chalk.cyan('\n🦝 Raccoon NFT Art Generator\n'));
    
    // Ensure output directories exist
    await fs.ensureDir(path.join(OUTPUT_PATH, 'images'));
    await fs.ensureDir(path.join(OUTPUT_PATH, 'metadata'));

    const spinner = ora('Generating raccoons...').start();
    
    const totalSupply = this.config.collection.totalSupply;
    let generated = 0;

    // Generate special editions first
    for (const special of this.config.specialEditions || []) {
      await this.generateSpecialEdition(special);
      generated++;
      spinner.text = `Generated ${generated}/${totalSupply} raccoons...`;
    }

    // Generate regular raccoons
    while (generated < totalSupply) {
      const tokenId = generated + 1;
      
      // Skip special edition IDs
      const isSpecialId = this.config.specialEditions?.some(s => s.id === tokenId);
      if (isSpecialId) {
        generated++;
        continue;
      }

      const success = await this.generateRaccoon(tokenId);
      if (success) {
        generated++;
        spinner.text = `Generated ${generated}/${totalSupply} raccoons...`;
      }
    }

    spinner.succeed(`Generated ${generated} unique raccoons!`);

    // Save metadata collection
    await this.saveMetadataCollection();
    
    console.log(chalk.green('\n✅ Generation complete!'));
    console.log(chalk.gray(`Images saved to: ${path.join(OUTPUT_PATH, 'images')}`));
    console.log(chalk.gray(`Metadata saved to: ${path.join(OUTPUT_PATH, 'metadata')}`));
  }

  async generateRaccoon(tokenId) {
    const traits = this.selectTraits();
    const dnaHash = this.getDNA(traits);

    // Check for duplicates
    if (this.generatedCombinations.has(dnaHash)) {
      return false; // Try again with different traits
    }

    this.generatedCombinations.add(dnaHash);

    // Create canvas
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext('2d');

    // Draw layers in order
    for (const layer of this.config.layers) {
      const trait = traits[layer.name];
      if (trait && trait !== 'None') {
        const imagePath = path.join(LAYERS_PATH, layer.name, trait.filename);
        
        // Check if file exists, if not create placeholder
        if (!fs.existsSync(imagePath)) {
          await this.createPlaceholderImage(imagePath, layer.name, trait.name);
        }
        
        try {
          const image = await loadImage(imagePath);
          ctx.drawImage(image, 0, 0, 1000, 1000);
        } catch (err) {
          console.warn(chalk.yellow(`Warning: Could not load ${imagePath}`));
        }
      }
    }

    // Save image
    const imageBuffer = canvas.toBuffer('image/png');
    const imagePath = path.join(OUTPUT_PATH, 'images', `${tokenId}.png`);
    await fs.writeFile(imagePath, imageBuffer);

    // Create metadata
    const metadata = this.createMetadata(tokenId, traits);
    this.metadata.push(metadata);

    // Save individual metadata file
    const metadataPath = path.join(OUTPUT_PATH, 'metadata', `${tokenId}.json`);
    await fs.writeJSON(metadataPath, metadata, { spaces: 2 });

    return true;
  }

  async generateSpecialEdition(special) {
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext('2d');

    // Create special edition placeholder
    const imagePath = path.join(LAYERS_PATH, 'special', special.filename);
    if (!fs.existsSync(imagePath)) {
      await this.createSpecialPlaceholder(imagePath, special.name);
    }

    try {
      const image = await loadImage(imagePath);
      ctx.drawImage(image, 0, 0, 1000, 1000);
    } catch (err) {
      // Create a unique special edition image
      ctx.fillStyle = '#1a0033';
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.fillStyle = '#ff00ff';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SPECIAL EDITION', 500, 450);
      ctx.fillText(special.name, 500, 550);
    }

    // Save image
    const imageBuffer = canvas.toBuffer('image/png');
    const outputImagePath = path.join(OUTPUT_PATH, 'images', `${special.id}.png`);
    await fs.writeFile(outputImagePath, imageBuffer);

    // Create metadata
    const metadata = {
      name: `${this.config.collection.name} #${special.id}`,
      description: special.description,
      image: `${this.config.collection.baseUri}${special.id}.png`,
      attributes: special.attributes
    };

    this.metadata.push(metadata);
    
    const metadataPath = path.join(OUTPUT_PATH, 'metadata', `${special.id}.json`);
    await fs.writeJSON(metadataPath, metadata, { spaces: 2 });
  }

  selectTraits() {
    const traits = {};

    for (const layer of this.config.layers) {
      const weights = layer.traits.map(t => t.weight);
      const names = layer.traits.map(t => t);
      
      const selected = weighted.select(names, weights);
      
      // Skip "None" traits for non-optional layers
      if (!layer.optional || selected.name !== 'None') {
        traits[layer.name] = selected;
      }
    }

    return traits;
  }

  getDNA(traits) {
    const dna = [];
    for (const layer of this.config.layers) {
      const trait = traits[layer.name];
      dna.push(trait ? trait.name : 'None');
    }
    return dna.join('-');
  }

  createMetadata(tokenId, traits) {
    const attributes = [];

    for (const layer of this.config.layers) {
      const trait = traits[layer.name];
      if (trait && trait.name !== 'None') {
        attributes.push({
          trait_type: layer.displayName,
          value: trait.name
        });
      }
    }

    // Add rarity score based on trait weights
    const rarityScore = this.calculateRarityScore(traits);
    attributes.push({
      trait_type: 'Rarity Score',
      value: rarityScore.toFixed(2)
    });

    return {
      name: `${this.config.collection.name} #${tokenId}`,
      description: this.config.collection.description,
      image: `${this.config.collection.baseUri}${tokenId}.png`,
      attributes: attributes
    };
  }

  calculateRarityScore(traits) {
    let score = 0;
    let count = 0;

    for (const layer of this.config.layers) {
      const trait = traits[layer.name];
      if (trait && trait.name !== 'None') {
        // Higher weight = more common = lower rarity score
        score += (100 - trait.weight);
        count++;
      }
    }

    return count > 0 ? score / count : 0;
  }

  async createPlaceholderImage(imagePath, layerName, traitName) {
    await fs.ensureDir(path.dirname(imagePath));
    
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext('2d');
    
    // Create a simple colored placeholder based on layer type
    const colors = {
      backgrounds: '#2a2a2a',
      bodies: '#8b4513',
      eyes: '#ff0000',
      mouths: '#ffffff',
      accessories: '#ffd700',
      hats: '#800080'
    };
    
    if (layerName === 'backgrounds') {
      ctx.fillStyle = colors[layerName] || '#333333';
      ctx.fillRect(0, 0, 1000, 1000);
    } else {
      // Make non-background layers transparent
      ctx.fillStyle = colors[layerName] || '#666666';
      ctx.globalAlpha = 0.8;
      
      // Draw a simple shape to represent the trait
      ctx.beginPath();
      ctx.arc(500, 500, 200, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add text label
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${layerName}: ${traitName}`, 500, 950);
    
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(imagePath, buffer);
  }

  async createSpecialPlaceholder(imagePath, name) {
    await fs.ensureDir(path.dirname(imagePath));
    
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1000, 1000);
    gradient.addColorStop(0, '#ff00ff');
    gradient.addColorStop(1, '#00ffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1000, 1000);
    
    // Add special text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPECIAL', 500, 450);
    ctx.font = '50px Arial';
    ctx.fillText(name, 500, 550);
    
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(imagePath, buffer);
  }

  async saveMetadataCollection() {
    const collectionPath = path.join(OUTPUT_PATH, 'metadata', '_collection.json');
    await fs.writeJSON(collectionPath, this.metadata, { spaces: 2 });
  }
}

// Run generator
const generator = new RaccoonGenerator();
generator.generate().catch(console.error);