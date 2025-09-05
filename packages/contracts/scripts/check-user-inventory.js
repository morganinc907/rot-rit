const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking user inventory on BOTH contracts...");
  
  const [deployer] = await ethers.getSigners();
  const userAddress = deployer.address;
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const correctMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const wrongMawAddress = "0x15243987458f1ed05b02e6213b532bb060027f4c";
  
  console.log(`👤 User: ${userAddress}`);
  console.log(`🏺 Relics: ${relicsAddress}`);
  console.log(`✅ Correct Maw: ${correctMawAddress}`);
  console.log(`❌ Wrong Maw: ${wrongMawAddress}`);
  
  const relicsContract = await ethers.getContractAt("Relics", relicsAddress);
  
  // Check keys on both contracts
  console.log("\n🔑 Key balances:");
  const keysBalance = await relicsContract.balanceOf(userAddress, 0);
  console.log(`Keys (token ID 0): ${keysBalance}`);
  
  // Check other tokens too
  console.log("\n📊 All token balances:");
  for (let tokenId = 0; tokenId < 10; tokenId++) {
    try {
      const balance = await relicsContract.balanceOf(userAddress, tokenId);
      if (balance > 0) {
        console.log(`Token ID ${tokenId}: ${balance}`);
      }
    } catch (error) {
      // Token might not exist, skip
    }
  }
  
  // Check approval status for both contracts
  console.log("\n✅ Approval status:");
  const correctApproval = await relicsContract.isApprovedForAll(userAddress, correctMawAddress);
  const wrongApproval = await relicsContract.isApprovedForAll(userAddress, wrongMawAddress);
  
  console.log(`Correct Maw approved: ${correctApproval}`);
  console.log(`Wrong Maw approved: ${wrongApproval}`);
  
  // If user has 6 keys but we see 10, maybe I minted to wrong address?
  console.log("\n🤔 Debug: Let me check who owns what...");
  
  // Check if the keys were minted to the deployer address
  const deployerBalance = await relicsContract.balanceOf(deployer.address, 0);
  console.log(`Deployer (${deployer.address}) has ${deployerBalance} keys`);
  
  // Maybe the frontend is using a different user address?
  // Let's check the owner of the relics contract
  const relicsOwner = await relicsContract.owner();
  console.log(`Relics owner: ${relicsOwner}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});