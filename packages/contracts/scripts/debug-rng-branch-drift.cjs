const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Debugging RNG branch drift in sacrificeKeys...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  console.log("🎲 Step 1: Check current RNG state that affects reward selection");
  
  // Get current block info that affects RNG
  const currentBlock = await ethers.provider.getBlockNumber();
  const blockInfo = await ethers.provider.getBlock(currentBlock);
  console.log(`Current block: ${currentBlock}`);
  console.log(`Block timestamp: ${blockInfo.timestamp}`);
  console.log(`Block hash: ${blockInfo.hash}`);
  
  // Check sacrifice nonce (affects RNG seed)
  const nonce = await maw.sacrificeNonce();
  console.log(`Sacrifice nonce: ${nonce}`);
  
  console.log("\n🔬 Step 2: Test potential reward IDs against Relics authorization");
  
  // Test minting each possible relic ID as the MAW contract
  const mawRole = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  console.log(`MAW role hash: ${mawRole}`);
  console.log(`MAW has role: ${await relics.hasRole(mawRole, PROXY_ADDRESS)}`);
  
  // Test each relic ID from 1-8 (typical range for rewards)
  for (let rewardId = 1; rewardId <= 8; rewardId++) {
    try {
      // Try to simulate minting this reward as the MAW contract
      await relics.mint.staticCall(USER_ADDRESS, rewardId, 1, "0x", {
        from: PROXY_ADDRESS
      });
      console.log(`✅ Reward ID ${rewardId}: mint would succeed`);
    } catch (error) {
      console.log(`❌ Reward ID ${rewardId}: mint would fail - ${error.message}`);
      
      // Check specific conditions
      const totalSupply = await relics.totalSupply(rewardId).catch(() => "unknown");
      const maxSupply = await relics.maxSupply(rewardId).catch(() => "unknown");
      console.log(`   Supply: ${totalSupply}/${maxSupply}`);
    }
  }
  
  console.log("\n🎯 Step 3: Check contract state after upgrade");
  
  // Check if any state got reset during upgrade
  const sacrificesPaused = await maw.sacrificesPaused();
  const conversionsPaused = await maw.conversionsPaused();
  console.log(`Sacrifices paused: ${sacrificesPaused}`);
  console.log(`Conversions paused: ${conversionsPaused}`);
  
  // Check cosmetic types setup
  try {
    const cosmeticTypes = await maw.currentCosmeticTypes(0);
    console.log(`Current cosmetic types[0]: ${cosmeticTypes}`);
  } catch (error) {
    console.log(`❌ Error reading cosmetic types: ${error.message}`);
  }
  
  console.log("\n⛽ Step 4: Test with much higher gas limit to avoid cliff");
  
  const rustedCapBalance = await relics.balanceOf(USER_ADDRESS, 0);
  if (rustedCapBalance >= 1) {
    try {
      console.log("🚀 Attempting sacrificeKeys with 2M gas limit...");
      const tx = await maw.sacrificeKeys(1, {
        gasLimit: 2000000  // Much higher to avoid gas cliff
      });
      
      console.log(`Transaction hash: ${tx.hash}`);
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log("🎉 SUCCESS with higher gas!");
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
        
        // Parse events to see what reward was minted
        for (const log of receipt.logs) {
          try {
            const parsed = relics.interface.parseLog(log);
            if (parsed && parsed.name === 'TransferSingle') {
              console.log(`Minted: ${parsed.args.value} of token ID ${parsed.args.id}`);
            }
          } catch (e) {
            // Not a relics event
          }
        }
      } else {
        console.log("❌ Still failed even with higher gas");
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      }
    } catch (error) {
      console.log("❌ Transaction still failed:", error.message);
      
      if (error.data) {
        console.log("Error data:", error.data);
        
        // Try to decode common errors
        try {
          const iface = new ethers.Interface([
            "error ERC1155InsufficientBalance(address account, uint256 id, uint256 value, uint256 balance)",
            "error ERC1155MissingApprovalForAll(address operator, address owner)",
            "error AccessControlUnauthorizedAccount(address account, bytes32 role)",
            "error MaxSupplyExceeded(uint256 tokenId, uint256 requested, uint256 available)"
          ]);
          
          const decoded = iface.parseError(error.data);
          console.log("🎯 Decoded error:", decoded);
        } catch (decodeError) {
          console.log("Could not decode error data");
        }
      }
    }
  } else {
    console.log(`❌ User needs rusted caps. Current balance: ${rustedCapBalance}`);
  }
}

main().catch(console.error);