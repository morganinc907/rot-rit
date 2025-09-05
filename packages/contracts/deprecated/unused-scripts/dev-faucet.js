// scripts/dev-faucet.js
// Dev faucet - gives you a starter kit for testing all sacrifice flows

const hre = require("hardhat");
const { safeCall } = require("../lib/decodeError");

async function main() {
  console.log("🚰 Dev Faucet - Starter Kit Generator\n");
  
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log("📋 Configuration:");
  console.log(`   Network: ${network}`);
  console.log(`   Account: ${deployer.address}`);
  
  // Load addresses
  const addresses = require("../packages/addresses/addresses.json");
  const abis = require("../packages/abis/index.json");
  
  if (!addresses[network]) {
    throw new Error(`No addresses found for network: ${network}. Deploy contracts first.`);
  }
  
  const relicsAddress = addresses[network]["Relics"];
  const mawAddress = addresses[network]["MawSacrificeV3Upgradeable"];
  
  const relics = new hre.ethers.Contract(relicsAddress, abis.Relics, deployer);
  const maw = new hre.ethers.Contract(mawAddress, abis.MawSacrificeV3Upgradeable, deployer);
  
  // Get config from contract constants
  console.log("\n📊 Getting contract configuration...");
  const rustedKeyId = await maw.RUSTED_KEY();
  const glassShardId = await maw.ASHES();
  const lanternFragmentId = await maw.LANTERN_FRAGMENT();
  const wormEatenMaskId = await maw.WORM_EATEN_MASK();
  const boneDaggerId = await maw.BONE_DAGGER();
  const ashVialId = await maw.ASH_VIAL();
  const bindingContractId = await maw.BINDING_CONTRACT();
  const soulDeedId = await maw.SOUL_DEED();
  
  console.log(`   Rusted Key ID: ${rustedKeyId}`);
  console.log(`   Glass Shard ID: ${glassShardId}`);
  console.log(`   Fragment ID: ${lanternFragmentId}`);
  console.log(`   Mask ID: ${wormEatenMaskId}`);
  console.log(`   Dagger ID: ${boneDaggerId}`);
  console.log(`   Vial ID: ${ashVialId}`);
  
  // Check if we're the owner (needed to mint)
  const owner = await relics.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("❌ You're not the Relics contract owner, can't mint test tokens");
    console.log(`   Owner: ${owner}`);
    console.log(`   You: ${deployer.address}`);
    return;
  }
  
  console.log("\n🎁 Minting starter kit...");
  
  const starterKit = [
    { id: rustedKeyId, amount: 10, name: "Rusted Keys" },      // For sacrificing
    { id: glassShardId, amount: 25, name: "Glass Shards" },   // For conversion (5:1 ratio)
    { id: lanternFragmentId, amount: 15, name: "Fragments" }, // For cosmetics
    { id: wormEatenMaskId, amount: 8, name: "Masks" },       // For cosmetics boost
    { id: boneDaggerId, amount: 6, name: "Daggers" },        // For demons
    { id: ashVialId, amount: 4, name: "Vials" },             // For demons
    { id: bindingContractId, amount: 1, name: "Binding Contract" }, // Rare (1/1)
    { id: soulDeedId, amount: 1, name: "Soul Deed" }         // Ultra rare (1/1)
  ];
  
  let totalMinted = 0;
  
  for (const item of starterKit) {
    try {
      await safeCall(
        () => relics.mint(deployer.address, item.id, item.amount, "0x"),
        'Relics',
        `Mint ${item.amount} ${item.name}`
      );
      
      console.log(`   ✅ ${item.amount}x ${item.name}`);
      totalMinted += item.amount;
      
      // Small delay to avoid nonce issues
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`   ❌ Failed to mint ${item.name}: ${error.message}`);
    }
  }
  
  console.log(`\n📦 Starter Kit Complete!`);
  console.log(`   Total items minted: ${totalMinted}`);
  
  // Verify balances
  console.log("\n🔍 Verifying balances...");
  for (const item of starterKit) {
    try {
      const balance = await relics.balanceOf(deployer.address, item.id);
      console.log(`   ${item.name}: ${balance} (expected: ${item.amount})`);
    } catch (error) {
      console.log(`   ${item.name}: Error checking balance`);
    }
  }
  
  console.log("\n🧪 Ready for testing!");
  console.log("   You can now test:");
  console.log("   • Key sacrifice (sacrificeKeys)");
  console.log("   • Glass Shard → Rusted Cap conversion (5:1 ratio)");
  console.log("   • Cosmetic sacrifice (fragments + masks)");
  console.log("   • Demon sacrifice (daggers + vials)");
  console.log("   • Rare item handling");
  
  console.log("\n📝 Suggested test sequence:");
  console.log("   1. npm run smoke:test  # Verify deployment");
  console.log("   2. Sacrifice 5 keys → get glass shards");
  console.log("   3. Convert 10 shards → get 2 rusted caps");
  console.log("   4. Sacrifice fragments for cosmetics");
  console.log("   5. Sacrifice daggers+vials for demons");
}

main()
  .then(() => process.exit(0))  
  .catch((error) => {
    console.error("💥 Dev faucet failed:", error.message);
    process.exit(1);
  });