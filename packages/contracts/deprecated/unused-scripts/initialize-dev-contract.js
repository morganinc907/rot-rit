const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Initializing dev contract...");

  const [signer] = await ethers.getSigners();
  
  // Contract addresses
  const devMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const cosmeticsAddress = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const demonsAddress = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  const cultistsAddress = "0x2D7cD25A014429282062298d2F712FA7983154B9";
  
  console.log(`Dev Contract: ${devMawAddress}`);
  console.log(`Relics: ${relicsAddress}`);
  console.log(`Cosmetics: ${cosmeticsAddress}`);
  console.log(`Demons: ${demonsAddress}`);
  console.log(`Cultists: ${cultistsAddress}`);
  
  // Get dev contract
  const maw = await ethers.getContractAt("MawSacrificeV4Dev", devMawAddress);
  
  // Initialize with minimal cooldown (1 block)
  console.log("📞 Calling initialize...");
  const tx = await maw.initialize(
    relicsAddress,
    cosmeticsAddress, 
    demonsAddress,
    cultistsAddress,
    1 // minBlocksBetween = 1
  );
  
  console.log(`Transaction: ${tx.hash}`);
  await tx.wait();
  console.log("✅ Dev contract initialized!");
  
  // Verify initialization
  const relics = await maw.relics();
  const cosmetics = await maw.cosmetics();
  console.log(`Verified relics: ${relics}`);
  console.log(`Verified cosmetics: ${cosmetics}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });