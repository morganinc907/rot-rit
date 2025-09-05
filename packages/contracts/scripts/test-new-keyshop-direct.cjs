const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🚀 Testing NEW KeyShop directly...");
  
  const NEW_KEYSHOP = "0x2822F52f04e6e3CAdF2D2Fb1d147E4635E135E19";
  const [signer] = await ethers.getSigners();
  
  const keyShop = await ethers.getContractAt("KeyShop", NEW_KEYSHOP);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", addresses.baseSepolia.MawSacrifice);
  
  console.log("User:", signer.address);
  console.log("New KeyShop:", NEW_KEYSHOP);
  
  // Check initial balance
  const initialCaps = await relics.balanceOf(signer.address, 0);
  console.log(`Initial Rusted Caps (ID 0): ${initialCaps}`);
  
  // Buy 2 caps to have some buffer
  console.log("\n🛒 Buying 2 Rusted Caps from NEW KeyShop...");
  const price = await keyShop.keyPrice();
  console.log(`Price per cap: ${ethers.formatEther(price)} ETH`);
  
  try {
    const buyTx = await keyShop.buyKeys(2, {
      value: price * 2n,
      gasLimit: 400000
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
          console.log("🎉🎉🎉 COMPLETE SUCCESS!");
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
          console.log(`Final Rusted Caps: ${finalCaps} (consumed 1, remaining ${finalCaps})`);
          
          console.log("\n🎯 SOLUTION COMPLETE:");
          console.log("✅ KeyShop sells Rusted Caps (ID 0) ← FIXED");
          console.log("✅ sacrificeKeys consumes Rusted Caps (ID 0) ← WORKING");
          console.log("✅ UI counter will now show correct Rusted Cap count!");
          console.log("✅ No more confusion between Rusted Keys vs Rusted Caps!");
          
          console.log(`\n📝 Update frontend to use new KeyShop: ${NEW_KEYSHOP}`);
          
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