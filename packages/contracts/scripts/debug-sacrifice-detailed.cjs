const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Detailed debugging of sacrificeKeys function...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const [signer] = await ethers.getSigners();
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  console.log("Signer address:", signer.address);
  console.log("User address:", USER_ADDRESS);
  
  // Check all the preconditions
  console.log("\n📊 Checking preconditions...");
  
  // 1. Check user's rusted cap balance
  const rustedCapBalance = await relics.balanceOf(USER_ADDRESS, 0);
  console.log(`✓ User rusted caps: ${rustedCapBalance}`);
  
  // 2. Check if user has approved the MAW contract
  const approval = await relics.isApprovedForAll(USER_ADDRESS, PROXY_ADDRESS);
  console.log(`✓ User approved MAW contract: ${approval}`);
  
  // 3. Check contract state
  const sacrificesPaused = await maw.sacrificesPaused();
  const contractPaused = await maw.paused();
  console.log(`✓ Sacrifices paused: ${sacrificesPaused}`);
  console.log(`✓ Contract paused: ${contractPaused}`);
  
  // 4. Check MAW's burn authorization on Relics
  const mawRole = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  const hasBurnRole = await relics.hasRole(mawRole, PROXY_ADDRESS);
  console.log(`✓ MAW has burn role: ${hasBurnRole}`);
  
  // 5. Check sacrifice nonce
  const nonce = await maw.sacrificeNonce();
  console.log(`✓ Current sacrifice nonce: ${nonce}`);
  
  if (rustedCapBalance < 1) {
    console.log("❌ Need at least 1 rusted cap");
    return;
  }
  
  if (!approval) {
    console.log("❌ User hasn't approved MAW contract");
    return;
  }
  
  if (!hasBurnRole) {
    console.log("❌ MAW doesn't have burn authorization");
    return;
  }
  
  // Try to estimate gas for the transaction
  console.log("\n⛽ Estimating gas...");
  try {
    const gasEstimate = await maw.sacrificeKeys.estimateGas(1);
    console.log(`✓ Gas estimate: ${gasEstimate.toString()}`);
  } catch (error) {
    console.log("❌ Gas estimation failed:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
    
    // Try to decode the error
    try {
      const iface = new ethers.Interface([
        "error ERC1155InsufficientBalance(address account, uint256 id, uint256 value, uint256 balance)",
        "error ERC1155MissingApprovalForAll(address operator, address owner)",
        "error AccessControlUnauthorizedAccount(address account, bytes32 role)"
      ]);
      
      if (error.data) {
        const decoded = iface.parseError(error.data);
        console.log("Decoded error:", decoded);
      }
    } catch (decodeError) {
      console.log("Couldn't decode error");
    }
    return;
  }
  
  // Try static call with detailed debugging
  console.log("\n🧪 Testing static call...");
  try {
    await maw.sacrificeKeys.staticCall(1);
    console.log("✅ Static call succeeded");
  } catch (error) {
    console.log("❌ Static call failed:", error.message);
    return;
  }
  
  // Try the actual transaction with low gas first to see what happens
  console.log("\n🚀 Attempting sacrificeKeys with detailed monitoring...");
  try {
    const tx = await maw.sacrificeKeys(1, {
      gasLimit: 800000
    });
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log(`Transaction status: ${receipt.status}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`Logs count: ${receipt.logs.length}`);
    
    if (receipt.status === 1) {
      console.log("🎉 Transaction succeeded!");
      
      // Check what changed
      const newBalance = await relics.balanceOf(USER_ADDRESS, 0);
      console.log(`New rusted cap balance: ${newBalance}`);
      
      // Check for any new relics
      for (let i = 1; i <= 8; i++) {
        const balance = await relics.balanceOf(USER_ADDRESS, i);
        if (balance > 0) {
          console.log(`Relic ID ${i}: ${balance}`);
        }
      }
    } else {
      console.log("❌ Transaction failed with status 0");
    }
    
  } catch (error) {
    console.log("❌ Transaction failed:", error.message);
    console.log("Error code:", error.code);
    
    if (error.data) {
      console.log("Error data:", error.data);
    }
    
    if (error.receipt) {
      console.log("Receipt status:", error.receipt.status);
      console.log("Gas used:", error.receipt.gasUsed.toString());
    }
  }
}

main().catch(console.error);