const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking proxy implementation...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  console.log("Proxy address:", PROXY_ADDRESS);
  
  // Check what addresses we have
  console.log("\nAll addresses:");
  for (const [name, addr] of Object.entries(addresses.baseSepolia)) {
    console.log(`- ${name}: ${addr}`);
  }
}

main().catch(console.error);
