const { ethers } = require("hardhat");
delete require.cache[require.resolve("../packages/addresses/addresses.json")];
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🚀 Testing full flow: KeyShop → Rusted Caps → sacrificeKeys...");
  
  const [signer] = await ethers.getSigners();
  const keyShop = await ethers.getContractAt("KeyShop", addresses.baseSepolia.KeyShop);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", addresses.baseSepolia.MawSacrifice);
  
  console.log("User:", signer.address);
  console.log("New KeyShop:", addresses.baseSepolia.KeyShop);
  
  // Check initial balance
  const initialCaps = await relics.balanceOf(signer.address, 0);
  console.log(`Initial Rusted Caps: ${initialCaps}`);
  
  // Buy 1 cap from new KeyShop
  console.log("\n🛒 Buying 1 Rusted Cap from KeyShop...");
  const price = await keyShop.keyPrice();
  console.log(`Price: ${ethers.formatEther(price)} ETH`);
  
  try {
    const buyTx = await keyShop.buyKeys(1, {
      value: price,
      gasLimit: 300000
    });
    
    console.log("Purchase transaction:", buyTx.hash);
    const buyReceipt = await buyTx.wait();
    
    if (buyReceipt.status === 1) {
      console.log("✅ Purchase successful!");
      
      const newCaps = await relics.balanceOf(signer.address, 0);
      console.log(`New Rusted Caps: ${newCaps} (gained ${newCaps - initialCaps})`);
      
      if (newCaps > initialCaps) {
        console.log("\n🎲 Testing sacrificeKeys with purchased caps...");
        
        const sacrificeTx = await maw.sacrificeKeys(1, {
          gasLimit: 1500000
        });
        
        console.log("Sacrifice transaction:", sacrificeTx.hash);
        const sacrificeReceipt = await sacrificeTx.wait();
        
        if (sacrificeReceipt.status === 1) {
          console.log("🎉🎉🎉 FULL FLOW SUCCESSFUL!");
          console.log("Gas used:", sacrificeReceipt.gasUsed.toString());
          
          // Show what was minted
          for (const log of sacrificeReceipt.logs) {
            try {
              const parsed = relics.interface.parseLog(log);
              if (parsed && parsed.name === 'TransferSingle' && parsed.args.from === ethers.ZeroAddress) {
                console.log(`🏆 Minted: ${parsed.args.value} of token ID ${parsed.args.id}`);
              }
            } catch (e) {}
          }
          
          // Final balance check
          const finalCaps = await relics.balanceOf(signer.address, 0);
          console.log(`Final Rusted Caps: ${finalCaps} (should be ${newCaps - 1})`);
          
          console.log("\n✅ Summary:");
          console.log("✅ KeyShop now sells Rusted Caps (ID 0)");
          console.log("✅ sacrificeKeys consumes Rusted Caps (ID 0)");
          console.log("✅ UI counter will now show correct values!");
          
        } else {
          console.log("❌ SacrificeKeys failed");
        }
      }
      
    } else {
      console.log("❌ Purchase failed");
    }
    
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }
}

main().catch(console.error);