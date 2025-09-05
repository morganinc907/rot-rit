const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔍 Debugging Full Transaction Details");
    console.log("====================================");
    
    const txHash = "0x5dd8c0e720ecb1fbef57a58dc134db486fe76add6f517d14568b683e759fd741";
    
    try {
        const provider = hre.ethers.provider;
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);
        
        console.log(`\n📋 Transaction Details:`);
        console.log(`Hash: ${tx.hash}`);
        console.log(`From: ${tx.from}`);
        console.log(`To: ${tx.to}`);
        console.log(`Value: ${tx.value}`);
        console.log(`Gas Limit: ${tx.gasLimit}`);
        console.log(`Gas Price: ${tx.gasPrice}`);
        console.log(`Data: ${tx.data.slice(0, 50)}...`);
        
        console.log(`\n📊 Receipt Details:`);
        console.log(`Status: ${receipt.status} (${receipt.status === 1 ? 'SUCCESS' : 'FAILED'})`);
        console.log(`Gas Used: ${receipt.gasUsed}`);
        console.log(`Block Number: ${receipt.blockNumber}`);
        console.log(`Logs Count: ${receipt.logs.length}`);
        
        console.log(`\n📝 All Events:`);
        const networkName = hre.network.name;
        const networkAddresses = addresses[networkName];
        const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrificeV4NoTimelock);
        const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
  
  console.log("\n📊 Pre-flight checks:");
  
  // Check balances
  const keyBalance = await relicsContract.balanceOf(deployer.address, 1);
  console.log(`🔑 Key balance: ${keyBalance}`);
  
  // Check approval
  const isApproved = await relicsContract.isApprovedForAll(deployer.address, mawAddress);
  console.log(`✅ MawSacrifice approved: ${isApproved}`);
  
  // Check contract state
  const lastBlock = await mawContract.lastSacrificeBlock(deployer.address);
  const minBlocks = await mawContract.minBlocksBetweenSacrifices();
  const currentBlock = await ethers.provider.getBlockNumber();
  
  console.log(`📦 Last sacrifice block: ${lastBlock}`);
  console.log(`⏱️  Min blocks between: ${minBlocks}`);
  console.log(`📦 Current block: ${currentBlock}`);
  console.log(`📊 Blocks since last: ${currentBlock - Number(lastBlock)}`);
  
  // Check if paused
  try {
    const isPaused = await mawContract.paused();
    const sacrificesPaused = await mawContract.sacrificesPaused();
    console.log(`⏸️  Contract paused: ${isPaused}`);
    console.log(`⏸️  Sacrifices paused: ${sacrificesPaused}`);
  } catch (error) {
    console.log("Could not check pause status");
  }
  
  console.log("\n🧪 Testing sacrifice...");
  
  if (!isApproved) {
    console.log("❌ Contract not approved - this might be the issue");
    return;
  }
  
  if (keyBalance === 0n) {
    console.log("❌ No keys to sacrifice");
    return;
  }
  
  try {
    // Try with call first to see what happens
    await mawContract.sacrificeKeys.staticCall(1);
    console.log("✅ Static call succeeded");
    
    // Try actual transaction
    console.log("🔥 Attempting real transaction...");
    const tx = await mawContract.sacrificeKeys(1);
    const receipt = await tx.wait();
    console.log(`✅ Transaction succeeded: ${receipt.hash}`);
    
  } catch (error) {
    console.log("❌ Transaction failed:");
    console.log("Full error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});