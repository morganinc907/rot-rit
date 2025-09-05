const hre = require("hardhat");

async function main() {
  console.log("🔍 Testing ERC-1155 Approval Fix...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  const relics = await hre.ethers.getContractAt("Relics", RELICS_ADDRESS);
  const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);

  // Check current approval status
  console.log("1️⃣ Checking current approval status:");
  const isApproved = await relics.isApprovedForAll(deployer.address, PROXY_ADDRESS);
  console.log("User has approved proxy:", isApproved);
  
  // Check token IDs
  console.log("\n2️⃣ Checking token IDs:");
  const shardId = await mawSacrifice.ASHES();
  const capId = await mawSacrifice.RUSTED_KEY();
  console.log("ASHES ID:", shardId.toString(), "(should be 8)");
  console.log("RUSTED_KEY ID:", capId.toString(), "(should be 1)");
  
  // Check balances
  const shardBalance = await relics.balanceOf(deployer.address, 8);
  console.log("Glass Shard balance:", shardBalance.toString());
  
  if (shardBalance < 5n) {
    console.log("❌ Need at least 5 glass shards");
    return;
  }
  
  // Test static call first
  console.log("\n3️⃣ Testing static call:");
  try {
    await mawSacrifice.convertShardsToRustedCaps.staticCall(5);
    console.log("✅ Static call would succeed");
  } catch (error) {
    console.log("❌ Static call failed:", error.message);
    if (error.data) console.log("Error data:", error.data);
  }
  
  if (!isApproved) {
    console.log("\n4️⃣ Setting approval for proxy...");
    const approveTx = await relics.setApprovalForAll(PROXY_ADDRESS, true);
    await approveTx.wait();
    console.log("✅ Approval set!");
    
    // Verify approval
    const newApproval = await relics.isApprovedForAll(deployer.address, PROXY_ADDRESS);
    console.log("New approval status:", newApproval);
  }
  
  console.log("\n5️⃣ Attempting conversion with approval...");
  try {
    const beforeShards = await relics.balanceOf(deployer.address, 8);
    const beforeCaps = await relics.balanceOf(deployer.address, 1);
    
    const tx = await mawSacrifice.convertShardsToRustedCaps(5, {
      gasLimit: 300000
    });
    
    const receipt = await tx.wait();
    
    const afterShards = await relics.balanceOf(deployer.address, 8);
    const afterCaps = await relics.balanceOf(deployer.address, 1);
    
    console.log("✅ SUCCESS!");
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Shards burned:", (beforeShards - afterShards).toString());
    console.log("Caps minted:", (afterCaps - beforeCaps).toString());
    console.log("Conversion ratio:", (beforeShards - afterShards).toString(), ":", (afterCaps - beforeCaps).toString());
    
  } catch (error) {
    console.log("❌ Still failed:", error.message);
    if (error.reason) console.log("Reason:", error.reason);
  }
}

main().catch(console.error);