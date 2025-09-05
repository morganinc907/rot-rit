const fs = require('fs');
const path = require('path');

// CONFIGURE THESE
const IMAGE_BASE_URI = "ipfs://YOUR_IMAGE_HASH/"; // Replace with your Pinata hash
const COLLECTION_SIZE = 100; // Number of raccoons
const OUTPUT_DIR = "./metadata";

// Trait data (customize based on your actual traits)
const TRAIT_NAMES = {
    head: ["Cap", "Beanie", "Crown", "Bandana", "None"],
    face: ["Glasses", "Eyepatch", "Mask", "None", "Scar"],
    body: ["Shirt", "Hoodie", "Armor", "Jacket", "None"],
    fur: ["Brown", "Gray", "Black", "White", "Golden"],
    background: ["Forest", "City", "Mountain", "Beach", "Space"]
};

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate metadata for each token
for (let tokenId = 1; tokenId <= COLLECTION_SIZE; tokenId++) {
    // Simple trait generation (replace with your actual trait assignment logic)
    const metadata = {
        name: `Raccoon #${tokenId}`,
        description: "A ritual raccoon with mysterious powers",
        image: `${IMAGE_BASE_URI}${tokenId}.png`,
        attributes: [
            {
                trait_type: "Head",
                value: TRAIT_NAMES.head[Math.floor(Math.random() * TRAIT_NAMES.head.length)]
            },
            {
                trait_type: "Face", 
                value: TRAIT_NAMES.face[Math.floor(Math.random() * TRAIT_NAMES.face.length)]
            },
            {
                trait_type: "Body",
                value: TRAIT_NAMES.body[Math.floor(Math.random() * TRAIT_NAMES.body.length)]
            },
            {
                trait_type: "Fur",
                value: TRAIT_NAMES.fur[Math.floor(Math.random() * TRAIT_NAMES.fur.length)]
            },
            {
                trait_type: "Background",
                value: TRAIT_NAMES.background[Math.floor(Math.random() * TRAIT_NAMES.background.length)]
            }
        ]
    };

    // Write JSON file
    fs.writeFileSync(
        path.join(OUTPUT_DIR, `${tokenId}.json`),
        JSON.stringify(metadata, null, 2)
    );
}

// Also create placeholder metadata for special states
const cultMetadata = {
    name: "Cult Member",
    description: "This raccoon has joined the cult",
    image: `${IMAGE_BASE_URI}cult.png`,
    attributes: [
        { trait_type: "State", value: "Cult" }
    ]
};

const deadMetadata = {
    name: "Memorial Raccoon",
    description: "This raccoon has been sacrificed",
    image: `${IMAGE_BASE_URI}dead.png`,
    attributes: [
        { trait_type: "State", value: "Dead" }
    ]
};

const prerevealMetadata = {
    name: "Mystery Raccoon",
    description: "This raccoon has not been revealed yet",
    image: `${IMAGE_BASE_URI}prereveal.png`,
    attributes: []
};

fs.writeFileSync(path.join(OUTPUT_DIR, "cult.json"), JSON.stringify(cultMetadata, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, "dead.json"), JSON.stringify(deadMetadata, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, "prereveal.json"), JSON.stringify(prerevealMetadata, null, 2));

console.log(`✅ Generated ${COLLECTION_SIZE} metadata files in ${OUTPUT_DIR}`);
console.log("\n📌 Next steps:");
console.log("1. Update IMAGE_BASE_URI with your Pinata image folder hash");
console.log("2. Update trait names to match your actual traits");
console.log("3. Upload the metadata folder to Pinata");
console.log("4. Use the metadata hash in your contract deployment");