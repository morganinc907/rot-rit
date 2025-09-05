const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking conversion result...");
  
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Check current balances
  const shards = await relics.balanceOf(USER_ADDRESS, 6);  // Glass shards
  const caps = await relics.balanceOf(USER_ADDRESS, 0);     // Rusted caps
  
  console.log(`User currently has:`);
  console.log(`  Glass shards (ID 6): ${shards}`);
  console.log(`  Rusted caps (ID 0): ${caps}`);
  
  // Check transaction receipt
  const txHash = "0xad397b9f1a9aa663ee62fbd21c209cc580e8f3c5ee5a41e2e088e1ee4f70355d";
  const receipt = await ethers.provider.getTransactionReceipt(txHash);
  
  console.log(`\nTransaction ${txHash}:`);
  console.log(`Status: ${receipt.status}`);
  console.log(`Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`Logs: ${receipt.logs.length}`);
  
  // Parse the logs to see what actually happened
  if (receipt.logs.length > 0) {
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      console.log(`Log ${i}: ${log.address} - ${log.topics[0]}`);
    }
  } else {
    console.log("No events emitted");
  }
}

main().catch(console.error);