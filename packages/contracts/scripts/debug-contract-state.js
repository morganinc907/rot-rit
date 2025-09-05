const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging contract state...");
  
  const [deployer] = await ethers.getSigners();
  const mawAddress = "0x15243987458f1ed05b02e6213b532bb060027f4c";
  const contract = await ethers.getContractAt("MawSacrificeV4NoTimelock", mawAddress);
  
  try {
    // Check sacrifice nonce
    const sacrificeNonce = await contract.sacrificeNonce();
    console.log(`🔢 Sacrifice nonce: ${sacrificeNonce}`);
    
    // Check owner
    const owner = await contract.owner();
    console.log(`👑 Contract owner: ${owner}`);
    console.log(`📍 Current user: ${deployer.address}`);
    console.log(`🤝 Is owner: ${owner.toLowerCase() === deployer.address.toLowerCase()}`);
    
    // Check if contract addresses are set
    const relicsAddress = await contract.relics();
    const cosmeticsAddress = await contract.cosmetics();
    console.log(`🏺 Relics contract: ${relicsAddress}`);
    console.log(`✨ Cosmetics contract: ${cosmeticsAddress}`);
    
    // Try to call the _random function indirectly by checking if we can access RNG seed
    console.log("\n🎲 Testing RNG components...");
    console.log(`📦 Block prevrandao available: ${typeof ethers.provider.getBlock}`);
    
  } catch (error) {
    console.log("❌ Error checking contract state:", error.message);
  }
  
  // Let's also check if this is the same issue we had before - wrong contract interface
  console.log("\n🔍 Checking contract interface...");
  try {
    const code = await ethers.provider.getCode(mawAddress);
    console.log(`📝 Contract has code: ${code.length > 2}`);
    console.log(`📏 Code length: ${code.length}`);
  } catch (error) {
    console.log("Could not check contract code");
  }
  
  // Let's try a very simple function call first
  try {
    console.log("\n🧪 Testing simple function calls...");
    const minBlocks = await contract.minBlocksBetweenSacrifices();
    console.log(`✅ Can call minBlocksBetweenSacrifices: ${minBlocks}`);
    
    const maxMythic = await contract.maxMythicDemons();
    console.log(`✅ Can call maxMythicDemons: ${maxMythic}`);
    
  } catch (error) {
    console.log("❌ Cannot call basic functions:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});