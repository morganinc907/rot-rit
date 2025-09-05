const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Fixing MAW authorization using setMawSacrifice()...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const [signer] = await ethers.getSigners();
  
  console.log("Owner address:", signer.address);
  console.log("MAW proxy address:", PROXY_ADDRESS);
  
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Use the setMawSacrifice function which automatically grants MAW_ROLE
  console.log("🚀 Setting MAW sacrifice address (auto-grants MAW_ROLE)...");
  try {
    const tx = await relics.setMawSacrifice(PROXY_ADDRESS);
    console.log("Transaction:", tx.hash);
    
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      console.log("✅ MAW sacrifice address set successfully!");
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // The setMawSacrifice function automatically grants MAW_ROLE
      console.log("🎉 MAW_ROLE has been automatically granted!");
      
      // Now test sacrificeKeys immediately
      const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
      const userAddress = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
      
      // Check user balance
      const balance = await relics.balanceOf(userAddress, 0);
      console.log(`\nUser rusted caps: ${balance}`);
      
      if (balance >= 1) {
        console.log("🚀 Testing sacrificeKeys now...");
        const sacrificeTx = await maw.sacrificeKeys(1, {
          gasLimit: 1500000
        });
        
        console.log("Sacrifice transaction:", sacrificeTx.hash);
        const sacrificeReceipt = await sacrificeTx.wait();
        
        if (sacrificeReceipt.status === 1) {
          console.log("🎉🎉🎉 SACRIFICEKEYS WORKS! Problem completely solved!");
          console.log("Gas used:", sacrificeReceipt.gasUsed.toString());
          
          // Show what was minted
          for (const log of sacrificeReceipt.logs) {
            try {
              const parsed = relics.interface.parseLog(log);
              if (parsed && parsed.name === 'TransferSingle' && parsed.args.from === ethers.ZeroAddress) {
                console.log(`🏆 Minted: ${parsed.args.value} of token ID ${parsed.args.id}`);
              }
            } catch (e) {
              // Not a mint event
            }
          }
          
          // Final verification - check new balances
          console.log("\n📊 Final balance check:");
          const newCaps = await relics.balanceOf(userAddress, 0);
          console.log(`Rusted caps: ${newCaps} (should be ${balance - 1})`);
          
          for (let i = 1; i <= 8; i++) {
            const relicBalance = await relics.balanceOf(userAddress, i);
            if (relicBalance > 0) {
              console.log(`Relic ID ${i}: ${relicBalance}`);
            }
          }
          
        } else {
          console.log("❌ SacrificeKeys still failed");
        }
      } else {
        console.log("⚠️ User needs rusted caps to test");
      }
      
    } else {
      console.log("❌ Setting MAW sacrifice failed");
    }
    
  } catch (error) {
    console.log("❌ Failed to set MAW sacrifice:", error.message);
  }
}

main().catch(console.error);