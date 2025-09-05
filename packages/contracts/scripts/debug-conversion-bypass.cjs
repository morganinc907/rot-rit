const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🧪 Testing conversion by understanding the exact error...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const [signer] = await ethers.getSigners();
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Let's trace through the exact logic that happens in convertShardsToRustedCaps
  console.log("🔍 Tracing convertShardsToRustedCaps logic...");
  
  const shardAmount = 5;
  const capsToMint = 1;
  
  console.log(`Attempting to convert ${shardAmount} shards to ${capsToMint} caps`);
  
  // Check 1: Amount validation
  if (shardAmount == 0 || shardAmount % 5 != 0) {
    console.log("❌ Would fail at InvalidAmount check");
    return;
  }
  console.log("✅ Amount validation passed");
  
  // Check 2: User balance
  const userBalance = await relics.balanceOf(USER_ADDRESS, 6);
  if (userBalance < shardAmount) {
    console.log("❌ Would fail at InsufficientBalance check");
    return;
  }
  console.log("✅ User balance check passed");
  
  // Check 3: canMintCaps check
  console.log("\n🧪 Testing canMintCaps logic step by step...");
  
  try {
    // This is what canMintCaps does internally
    const callData = relics.interface.encodeFunctionData("mint", [
      PROXY_ADDRESS, // address(this) = MAW contract address
      0,             // RUSTED_CAP
      1,             // amount
      "0x"           // empty bytes
    ]);
    
    console.log("Static call data:", callData);
    console.log("Static call from:", PROXY_ADDRESS);
    console.log("Static call to:", addresses.baseSepolia.Relics);
    
    const result = await ethers.provider.call({
      to: addresses.baseSepolia.Relics,
      data: callData,
      from: PROXY_ADDRESS
    });
    
    console.log("✅ Static call succeeded - this means canMintCaps SHOULD return true");
    console.log("Result:", result);
    
    // But let's also test the actual canMintCaps function
    const actualCanMint = await maw.canMintCaps(1);
    console.log("Actual canMintCaps(1):", actualCanMint);
    
    if (!actualCanMint) {
      console.log("🤔 This is weird - the static call works but canMintCaps returns false");
      console.log("There might be a bug in the canMintCaps implementation itself");
    }
    
  } catch (error) {
    console.log("❌ Static call failed:", error.message);
    console.log("This is why canMintCaps returns false");
  }
  
  // Let's try the conversion anyway to see what happens
  console.log("\n🚀 Attempting conversion despite canMintCaps result...");
  try {
    const tx = await maw.convertShardsToRustedCaps(5, {
      gasLimit: 500000
    });
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      console.log("🎉 CONVERSION WORKED! The canMintCaps check was the only issue.");
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // Check balances
      const newShardBalance = await relics.balanceOf(USER_ADDRESS, 6);
      const newCapBalance = await relics.balanceOf(USER_ADDRESS, 0);
      console.log(`New balances - Shards: ${newShardBalance}, Caps: ${newCapBalance}`);
    } else {
      console.log("❌ Transaction failed");
    }
    
  } catch (error) {
    console.log("❌ Conversion failed:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
      
      // Decode the error
      if (error.data.includes("43617073536f6c644f75744f72446973616c6c6f776564")) {
        console.log("🎯 Still getting CapsSoldOutOrDisallowed error");
      }
    }
  }
}

main().catch(console.error);