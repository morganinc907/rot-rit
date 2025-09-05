const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Testing sacrifice with revert data capture...");
  
  const [signer] = await ethers.getSigners();
  const networkAddresses = addresses.baseSepolia;
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrifice);
    
    console.log("User:", signer.address);
    console.log("Proxy:", networkAddresses.MawSacrifice);
    
    // Try with more explicit error handling
    const tx = await maw.sacrificeKeys.populateTransaction(1);
    console.log("Transaction data:", tx);
    
    // Try to call it and catch the specific error
    try {
      const result = await signer.call(tx);
      console.log("Call result:", result);
    } catch (error) {
      console.log("Call error:", error);
      if (error.data) {
        console.log("Error data:", error.data);
        
        // Try to decode if its a custom error
        try {
          const decoded = maw.interface.parseError(error.data);
          console.log("Decoded error:", decoded);
        } catch (e) {
          console.log("Could not decode error");
        }
      }
    }
    
  } catch (error) {
    console.error("Script error:", error);
  }
}

main().catch(console.error);
