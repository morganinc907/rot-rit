const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Investigating new KeyShop transaction...");
  
  const NEW_KEYSHOP = "0x2822F52f04e6e3CAdF2D2Fb1d147E4635E135E19";
  const TX_HASH = "0x8f208d3c63286562556a6d81eb0dc8aa4489d1ee04de7a3be4ba4ef4db6b268f";
  
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  const keyShop = await ethers.getContractAt("KeyShop", NEW_KEYSHOP);
  
  // Check transaction receipt
  const receipt = await ethers.provider.getTransactionReceipt(TX_HASH);
  console.log("Transaction status:", receipt.status);
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Logs count:", receipt.logs.length);
  
  // Parse the logs to see what events were emitted
  if (receipt.logs.length > 0) {
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      console.log(`\nLog ${i}:`);
      console.log(`  Address: ${log.address}`);
      console.log(`  Topics: ${log.topics.map(t => t.slice(0, 10))}...`);
      
      // Try to decode as KeyShop event
      try {
        const parsed = keyShop.interface.parseLog(log);
        if (parsed) {
          console.log(`  KeyShop Event: ${parsed.name}`, parsed.args);
        }
      } catch (e) {
        // Try to decode as Relics event
        try {
          const parsed = relics.interface.parseLog(log);
          if (parsed) {
            console.log(`  Relics Event: ${parsed.name}`, parsed.args);
          }
        } catch (e2) {
          console.log(`  Could not decode event`);
        }
      }
    }
  }
  
  // Check if KeyShop has proper authorization
  console.log("\n🔑 Checking KeyShop authorization...");
  const keyshopRole = ethers.keccak256(ethers.toUtf8Bytes("KEYSHOP_ROLE"));
  
  try {
    const hasRole = await relics.hasRole(keyshopRole, NEW_KEYSHOP);
    console.log(`KeyShop has KEYSHOP_ROLE: ${hasRole}`);
  } catch (error) {
    console.log("Could not check role:", error.message);
  }
  
  // Check what token ID the KeyShop is trying to mint
  const tokenId = await keyShop.RUSTED_KEY_ID();
  console.log(`KeyShop mints token ID: ${tokenId} (should be 0 for Rusted Caps)`);
}

main().catch(console.error);