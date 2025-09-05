const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Setting up new KeyShop...");
  
  const NEW_KEYSHOP = "0x2822F52f04e6e3CAdF2D2Fb1d147E4635E135E19";
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Grant KEYSHOP_ROLE to new contract
  console.log("🔑 Granting KEYSHOP_ROLE to new KeyShop...");
  try {
    const tx = await relics.setKeyShop(NEW_KEYSHOP, {
      gasPrice: ethers.parseUnits("10", "gwei")
    });
    
    console.log("Grant transaction:", tx.hash);
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log("✅ KEYSHOP_ROLE granted successfully!");
      
      // Test purchase
      console.log("\n🧪 Testing new KeyShop...");
      const keyShop = await ethers.getContractAt("KeyShop", NEW_KEYSHOP);
      const [signer] = await ethers.getSigners();
      
      const price = await keyShop.keyPrice();
      console.log(`Price per cap: ${ethers.formatEther(price)} ETH`);
      
      const buyTx = await keyShop.buyKeys(1, {
        value: price,
        gasLimit: 300000
      });
      
      console.log("Purchase transaction:", buyTx.hash);
      const buyReceipt = await buyTx.wait();
      
      if (buyReceipt.status === 1) {
        console.log("🎉 KeyShop purchase successful!");
        
        const balance = await relics.balanceOf(signer.address, 0);
        console.log(`Your Rusted Caps (ID 0): ${balance}`);
        
        console.log("\n✅ KeyShop now sells Rusted Caps (ID 0) instead of Rusted Keys (ID 1)!");
        console.log("✅ This matches what sacrificeKeys() needs!");
        console.log("✅ UI counter should now work correctly!");
        
      } else {
        console.log("❌ Purchase test failed");
      }
      
    } else {
      console.log("❌ Role grant failed");
    }
    
  } catch (error) {
    console.log("❌ Setup failed:", error.message);
  }
  
  console.log(`\n📝 New KeyShop deployed at: ${NEW_KEYSHOP}`);
  console.log("Update your addresses.json and frontend to use this address.");
}

main().catch(console.error);