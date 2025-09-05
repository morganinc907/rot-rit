const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const chalk = require('chalk');
const ora = require('ora');
const weighted = require('weighted');

const CONFIG_PATH = path.join(__dirname, '../config/demon-traits.json');
const LAYERS_PATH = path.join(__dirname, '../layers/demons');
const OUTPUT_PATH = path.join(__dirname, '../output/demons');

class DemonGenerator {
  constructor() {
    this.config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    this.generatedCombinations = new Set();
    this.rareMetadata = [];
    this.mythicMetadata = [];
  }

  async generate() {
    console.log(chalk.red('\n👹 Demon NFT Art Generator\n'));
    
    // Ensure output directories exist
    await fs.ensureDir(path.join(OUTPUT_PATH, 'images', 'rare'));
    await fs.ensureDir(path.join(OUTPUT_PATH, 'images', 'mythic'));
    await fs.ensureDir(path.join(OUTPUT_PATH, 'metadata', 'rare'));
    await fs.ensureDir(path.join(OUTPUT_PATH, 'metadata', 'mythic'));

    // Generate Rare demons (trait-based)
    await this.generateRareDemons();

    // Process Mythic demons (1/1 art)
    await this.processMythicDemons();

    console.log(chalk.green('\n✅ Demon generation complete!'));
    console.log(chalk.gray(`Rare demons: ${path.join(OUTPUT_PATH, 'images', 'rare')}`));
    console.log(chalk.gray(`Mythic demons: ${path.join(OUTPUT_PATH, 'images', 'mythic')}`));
    console.log(chalk.gray(`Metadata: ${path.join(OUTPUT_PATH, 'metadata')}`));
  }

  async generateRareDemons() {
    const spinner = ora('Generating rare demons...').start();
    
    const totalRare = this.config.collection.rareTotalSupply;
    let generated = 0;

    while (generated < totalRare) {
      const tokenId = generated + 1;
      const success = await this.generateRareDemon(tokenId);
      
      if (success) {
        generated++;
        spinner.text = `Generated ${generated}/${totalRare} rare demons...`;
      }
    }

    spinner.succeed(`Generated ${generated} unique rare demons!`);

    // Save rare metadata collection
    const rareCollectionPath = path.join(OUTPUT_PATH, 'metadata', 'rare', '_collection.json');
    await fs.writeJSON(rareCollectionPath, this.rareMetadata, { spaces: 2 });
  }

  async generateRareDemon(tokenId) {
    const traits = this.selectRareTraits();
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
    for (const layer of this.config.rareLayers) {
      const trait = traits[layer.name];
      if (trait) {
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
    const imagePath = path.join(OUTPUT_PATH, 'images', 'rare', `${tokenId}.png`);
    await fs.writeFile(imagePath, imageBuffer);

    // Create metadata compatible with contract
    const metadata = this.createRareMetadata(tokenId, traits);
    this.rareMetadata.push(metadata);

    // Save individual metadata file
    const metadataPath = path.join(OUTPUT_PATH, 'metadata', 'rare', `${tokenId}.json`);
    await fs.writeJSON(metadataPath, metadata, { spaces: 2 });

    return true;
  }

  async processMythicDemons() {
    const spinner = ora('Processing mythic demons...').start();
    
    // Create placeholders for mythic demons and generate metadata
    for (const mythic of this.config.mythicEditions) {
      await this.processMythicDemon(mythic);
      spinner.text = `Processed mythic demon: ${mythic.name}`;
    }

    spinner.succeed(`Processed ${this.config.mythicEditions.length} mythic demons!`);

    // Save mythic metadata collection
    const mythicCollectionPath = path.join(OUTPUT_PATH, 'metadata', 'mythic', '_collection.json');
    await fs.writeJSON(mythicCollectionPath, this.mythicMetadata, { spaces: 2 });
  }

  async processMythicDemon(mythic) {
    const tokenId = mythic.id;
    
    // Check if custom art exists
    const customArtPath = path.join(LAYERS_PATH, 'mythic', mythic.filename);
    
    if (!fs.existsSync(customArtPath)) {
      // Create placeholder for now
      await this.createMythicPlaceholder(customArtPath, mythic.name);
    }

    // Copy/create the mythic image
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext('2d');

    try {
      const image = await loadImage(customArtPath);
      ctx.drawImage(image, 0, 0, 1000, 1000);
    } catch (err) {
      // Create placeholder if image fails to load
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1000, 1000);
      
      // Add mythic gradient background
      const gradient = ctx.createRadialGradient(500, 500, 0, 500, 500, 500);
      gradient.addColorStop(0, '#ff0000');
      gradient.addColorStop(0.5, '#800080');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1000, 1000);
      
      // Add text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('MYTHIC DEMON', 500, 400);
      ctx.fillText('MYTHIC DEMON', 500, 400);
      
      ctx.font = '40px Arial';
      ctx.strokeText(mythic.name, 500, 500);
      ctx.fillText(mythic.name, 500, 500);
      
      ctx.font = '24px Arial';
      ctx.fillText(`Token ID: ${tokenId}`, 500, 600);
    }

    // Save image
    const imageBuffer = canvas.toBuffer('image/png');
    const imagePath = path.join(OUTPUT_PATH, 'images', 'mythic', `${tokenId}.png`);
    await fs.writeFile(imagePath, imageBuffer);

    // Create metadata compatible with contract
    const metadata = {
      name: `Demon #${tokenId}`,
      description: mythic.description,
      image: `${this.config.collection.baseUri}${tokenId}.png`,
      attributes: [
        { trait_type: 'Rarity', value: 'Mythic' },
        ...mythic.attributes
      ]
    };

    this.mythicMetadata.push(metadata);
    
    const metadataPath = path.join(OUTPUT_PATH, 'metadata', 'mythic', `${tokenId}.json`);
    await fs.writeJSON(metadataPath, metadata, { spaces: 2 });
  }

  selectRareTraits() {
    const traits = {};

    for (const layer of this.config.rareLayers) {
      const weights = layer.traits.map(t => t.weight);
      const names = layer.traits.map(t => t);
      
      const selected = weighted.select(names, weights);
      traits[layer.name] = selected;
    }

    return traits;
  }

  getDNA(traits) {
    const dna = [];
    for (const layer of this.config.rareLayers) {
      const trait = traits[layer.name];
      dna.push(trait ? trait.name : 'None');
    }
    return dna.join('-');
  }

  createRareMetadata(tokenId, traits) {
    const attributes = [
      { trait_type: 'Rarity', value: 'Rare' }
    ];

    for (const layer of this.config.rareLayers) {
      const trait = traits[layer.name];
      if (trait) {
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
      name: `Demon #${tokenId}`,
      description: 'A summoned demon with unique traits and dark powers',
      image: `${this.config.collection.baseUri}${tokenId}.png`,
      attributes: attributes
    };
  }

  calculateRarityScore(traits) {
    let score = 0;
    let count = 0;

    for (const layer of this.config.rareLayers) {
      const trait = traits[layer.name];
      if (trait) {
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
    
    // Create different colored placeholders based on layer type
    const colors = {
      backgrounds: ['#1a0000', '#330000', '#4d0000'],
      forms: ['#2d1810', '#1a0d06', '#4d2414'],
      heads: ['#4d0026', '#330019', '#66003d'],
      faces: ['#4d1a00', '#331100', '#662200'],
      auras: ['#1a1a4d', '#111133', '#2d2d66']
    };
    
    const layerColors = colors[layerName] || ['#333333', '#444444', '#555555'];
    
    if (layerName === 'backgrounds') {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 1000, 1000);
      gradient.addColorStop(0, layerColors[0]);
      gradient.addColorStop(0.5, layerColors[1]);
      gradient.addColorStop(1, layerColors[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1000, 1000);
    } else {
      // Make non-background layers with transparency
      ctx.fillStyle = layerColors[1];
      ctx.globalAlpha = 0.8;
      
      // Draw different shapes based on layer type
      if (layerName === 'forms') {
        // Draw body shape
        ctx.fillRect(350, 200, 300, 600);
        ctx.beginPath();
        ctx.arc(500, 200, 150, 0, Math.PI * 2);
        ctx.fill();
      } else if (layerName === 'heads') {
        // Draw head shape
        ctx.beginPath();
        ctx.arc(500, 300, 200, 0, Math.PI * 2);
        ctx.fill();
      } else if (layerName === 'faces') {
        // Draw facial features
        ctx.fillRect(450, 250, 20, 40); // eye
        ctx.fillRect(530, 250, 20, 40); // eye
        ctx.fillRect(480, 320, 40, 20); // mouth
      } else if (layerName === 'auras') {
        // Draw aura effect
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(500, 500, 300 + i * 50, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    
    // Add text label
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(`${layerName}: ${traitName}`, 500, 950);
    ctx.fillText(`${layerName}: ${traitName}`, 500, 950);
    
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(imagePath, buffer);
  }

  async createMythicPlaceholder(imagePath, name) {
    await fs.ensureDir(path.dirname(imagePath));
    
    const canvas = createCanvas(1000, 1000);
    const ctx = canvas.getContext('2d');
    
    // Create epic background
    const gradient = ctx.createRadialGradient(500, 500, 0, 500, 500, 500);
    gradient.addColorStop(0, '#ff6600');
    gradient.addColorStop(0.3, '#cc0000');
    gradient.addColorStop(0.7, '#330066');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1000, 1000);
    
    // Add mystical effects
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(500, 500, 200 + i * 100, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('MYTHIC', 500, 400);
    ctx.fillText('MYTHIC', 500, 400);
    
    ctx.font = '50px Arial';
    ctx.strokeText(name, 500, 500);
    ctx.fillText(name, 500, 500);
    
    ctx.font = '30px Arial';
    ctx.fillText('1/1 LEGENDARY DEMON', 500, 600);
    
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(imagePath, buffer);
  }
}

// Run generator
const generator = new DemonGenerator();
generator.generate().catch(console.error);