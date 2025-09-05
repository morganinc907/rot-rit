const hre = require("hardhat");

async function main() {
  console.log('🔍 Debugging recent sacrifice transaction...');
  
  const userAddress = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const cosmeticsAddress = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  
  console.log('User:', userAddress);
  
  // Get recent transactions
  const provider = hre.ethers.provider;
  const currentBlock = await provider.getBlockNumber();
  console.log('Current block:', currentBlock);
  
  // Look back 100 blocks for recent transactions
  const fromBlock = currentBlock - 100;
  
  // Check for transfers TO the user (rewards)
  console.log('\n🎁 Checking for transfers TO user (rewards)...');
  const transfersTo = await provider.getLogs({
    fromBlock: fromBlock,
    toBlock: 'latest',
    address: relicsAddress,
    topics: [
      '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62', // TransferSingle
      null, // operator
      null, // from (any)
      hre.ethers.zeroPadValue(userAddress, 32) // to (user)
    ]
  });
  
  console.log(`Found ${transfersTo.length} transfers TO user`);
  
  // Check for transfers FROM the user (sacrifices)  
  console.log('\n🔥 Checking for transfers FROM user (sacrifices)...');
  const transfersFrom = await provider.getLogs({
    fromBlock: fromBlock,
    toBlock: 'latest',
    address: relicsAddress,
    topics: [
      '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62', // TransferSingle
      null, // operator
      hre.ethers.zeroPadValue(userAddress, 32), // from (user)
      null // to (any)
    ]
  });
  
  console.log(`Found ${transfersFrom.length} transfers FROM user`);
  
  // Parse recent transfers
  const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
  
  for (const log of transfersFrom) {
    try {
      const parsed = relics.interface.parseLog(log);
      console.log(`📤 BURNED: Token ID ${parsed.args.id} Amount ${parsed.args.value} (Block ${log.blockNumber})`);
    } catch (e) {
      console.log('Failed to parse transfer:', e.message);
    }
  }
  
  for (const log of transfersTo) {
    try {
      const parsed = relics.interface.parseLog(log);
      console.log(`📥 RECEIVED: Token ID ${parsed.args.id} Amount ${parsed.args.value} (Block ${log.blockNumber})`);
    } catch (e) {
      console.log('Failed to parse transfer:', e.message);
    }
  }
  
  // Check for FallbackShard events
  console.log('\n💎 Checking for FallbackShard events...');
  const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
  
  try {
    const fallbackEvents = await maw.queryFilter(
      maw.filters.FallbackShard(userAddress),
      fromBlock
    );
    
    console.log(`Found ${fallbackEvents.length} FallbackShard events`);
    for (const event of fallbackEvents) {
      console.log(`💎 FallbackShard: attempted reward ID ${event.args.attemptedRewardId} (Block ${event.blockNumber})`);
    }
  } catch (e) {
    console.log('Error checking FallbackShard events:', e.message);
  }
  
  // Check MAW authorization for cosmetics
  console.log('\n🎨 Checking MAW authorization for cosmetics...');
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  
  try {
    const minterRole = await cosmetics.MINTER_ROLE();
    const hasMinterRole = await cosmetics.hasRole(minterRole, mawAddress);
    console.log('MAW has MINTER_ROLE on cosmetics:', hasMinterRole);
    
    if (!hasMinterRole) {
      console.log('❌ MAW cannot mint cosmetics - that\'s why you\'re getting fallback shards!');
      console.log('💡 Need to grant MINTER_ROLE to MAW contract');
    }
  } catch (e) {
    console.log('Error checking cosmetics authorization:', e.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});