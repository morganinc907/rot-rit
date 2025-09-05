const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking convertShardsToRustedCaps state...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f4f";  // Fixed missing digit
  const GLASS_SHARD_ID = 6;
  const RUSTED_KEY_ID = 1;
  const [signer] = await ethers.getSigners();
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    console.log("📊 Checking user balances:");
    const shardBalance = await relics.balanceOf(USER_ADDRESS, GLASS_SHARD_ID);
    const keyBalance = await relics.balanceOf(USER_ADDRESS, RUSTED_KEY_ID);
    console.log(`- Glass Shards: ${shardBalance}`);
    console.log(`- Rusted Caps: ${keyBalance}`);
    
    console.log("\n🔐 Checking pause states:");
    const isPaused = await maw.paused();
    console.log(`- Contract paused: ${isPaused}`);
    
    try {
      const conversionsStatus = await maw.conversionsPaused();
      console.log(`- Conversions paused: ${conversionsStatus}`);
    } catch (e) {
      console.log("- Conversions paused: unable to check (might not exist)");
    }
    
    try {
      const sacrificesStatus = await maw.sacrificesPaused();
      console.log(`- Sacrifices paused: ${sacrificesStatus}`);
    } catch (e) {
      console.log("- Sacrifices paused: unable to check (might not exist)");
    }
    
    console.log("\n🧮 Checking conversion math:");
    const shardAmount = 10;
    console.log(`- Converting ${shardAmount} shards`);
    console.log(`- Is divisible by 5: ${shardAmount % 5 === 0}`);
    console.log(`- Would get ${shardAmount / 5} rusted caps`);
    
    console.log("\n🔗 Checking approvals:");
    const isApproved = await relics.isApprovedForAll(USER_ADDRESS, PROXY_ADDRESS);
    console.log(`- Is approved for all: ${isApproved}`);
    
    // Check if maw contract can burn glass shards from user
    console.log("\n🔥 Checking burn authorization:");
    try {
      // Test if the maw contract can burn from user
      const burnCalldata = relics.interface.encodeFunctionData("burn", [
        USER_ADDRESS,
        GLASS_SHARD_ID,
        1
      ]);
      
      await ethers.provider.call({
        from: PROXY_ADDRESS,
        to: RELICS_ADDRESS,
        data: burnCalldata
      });
      console.log("✅ Maw CAN burn glass shards from user");
    } catch (e) {
      console.log("❌ Maw CANNOT burn glass shards from user");
      console.log("Error:", e.message);
    }
    
    // Check if maw contract can mint rusted caps to user
    console.log("\n💎 Checking mint authorization:");
    try {
      const mintCalldata = relics.interface.encodeFunctionData("mint", [
        USER_ADDRESS,
        RUSTED_KEY_ID,
        1,
        "0x"
      ]);
      
      await ethers.provider.call({
        from: PROXY_ADDRESS,
        to: RELICS_ADDRESS,
        data: mintCalldata
      });
      console.log("✅ Maw CAN mint rusted caps to user");
    } catch (e) {
      console.log("❌ Maw CANNOT mint rusted caps to user");
      console.log("Error:", e.message);
    }
    
    console.log("\n🧪 Testing actual conversion:");
    if (shardBalance >= 10 && isApproved) {
      try {
        // Try to estimate gas for the conversion
        const gasEstimate = await maw.convertShardsToRustedCaps.estimateGas(10, {
          from: USER_ADDRESS
        });
        console.log(`✅ Gas estimate: ${gasEstimate}`);
      } catch (error) {
        console.log("❌ Gas estimation failed:");
        console.log("Error:", error.message);
        
        // Try to decode the specific revert reason
        if (error.data) {
          try {
            // Look for common revert signatures
            const errorSig = error.data.slice(0, 10);
            console.log("Error signature:", errorSig);
            
            if (errorSig === "0x8615b324") {
              console.log("🔍 This is 'ConversionsPaused()' error");
            } else if (errorSig === "0x356680b7") {
              console.log("🔍 This is 'InsufficientBalance()' error");
            } else if (errorSig === "0x2c5211c6") {
              console.log("🔍 This is 'InvalidAmount()' error");
            }
          } catch (decodeError) {
            console.log("Could not decode error");
          }
        }
      }
    } else {
      console.log("❌ Cannot test - insufficient shards or not approved");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);