const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔄 Force V5 upgrade using UUPS interface...");
  
  const PROXY = addresses.baseSepolia.MawSacrifice;
  const IMPL = "0x5FFe133461c89D3432dBc662787D1a18922B376E";
  
  // Connect as UUPS upgradeable
  const uups = await ethers.getContractAt([
    "function upgradeToAndCall(address newImplementation, bytes calldata data) external",
    "function owner() external view returns (address)"
  ], PROXY);
  
  console.log("Proxy:", PROXY);
  console.log("Implementation:", IMPL);
  
  try {
    const owner = await uups.owner();
    console.log("Owner:", owner);
    
    const upgradeTx = await uups.upgradeToAndCall(IMPL, "0x", {
      gasLimit: 500000
    });
    
    console.log("Upgrade transaction:", upgradeTx.hash);
    const receipt = await upgradeTx.wait();
    
    if (receipt.status === 1) {
      console.log("✅ Upgrade successful!");
      
      // Now initialize
      console.log("\n🔧 Initializing V5...");
      const v5 = await ethers.getContractAt("MawSacrificeV5", PROXY);
      
      const initTx = await v5.initializeV5(0, 1, 2, 6, {
        gasLimit: 300000
      });
      
      const initReceipt = await initTx.wait();
      
      if (initReceipt.status === 1) {
        console.log("✅ V5 initialized!");
        
        // Test it
        const capId = await v5.capId();
        console.log(`Cap ID: ${capId}`);
        
        const gasEstimate = await v5.sacrificeKeys.estimateGas(1);
        console.log(`Gas estimate: ${gasEstimate.toString()}`);
        
        if (gasEstimate < 1000000) {
          console.log("🎉 UNDERFLOW FIXED! V5 WORKING!");
        }
        
      } else {
        console.log("❌ Init failed");
      }
      
    } else {
      console.log("❌ Upgrade failed");  
    }
    
  } catch (error) {
    console.log("❌ Failed:", error.message);
  }
}

main().catch(console.error);