const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🚀 Deploying updated KeyShop (sells Rusted Caps ID 0)...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Relics address:", addresses.baseSepolia.Relics);
  
  // Deploy new KeyShop
  const KeyShop = await ethers.getContractFactory("KeyShop");
  const keyShop = await KeyShop.deploy(addresses.baseSepolia.Relics);
  await keyShop.waitForDeployment();
  
  const keyShopAddress = await keyShop.getAddress();
  console.log("✅ New KeyShop deployed at:", keyShopAddress);
  
  // Grant KEYSHOP_ROLE to the new contract
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  console.log("🔑 Granting KEYSHOP_ROLE to new KeyShop...");
  
  try {
    const tx = await relics.setKeyShop(keyShopAddress);
    console.log("Grant transaction:", tx.hash);
    
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      console.log("✅ KEYSHOP_ROLE granted successfully!");
    } else {
      console.log("❌ Role grant failed");
    }
  } catch (error) {
    console.log("❌ Error granting role:", error.message);
  }
  
  // Test the new KeyShop with a small purchase
  console.log("\n🧪 Testing new KeyShop with 1 cap purchase...");
  try {
    const price = await keyShop.keyPrice();
    console.log(`Price per cap: ${ethers.formatEther(price)} ETH`);
    
    const buyTx = await keyShop.buyKeys(1, {
      value: price,
      gasLimit: 300000
    });
    
    console.log("Purchase transaction:", buyTx.hash);
    const buyReceipt = await buyTx.wait();
    
    if (buyReceipt.status === 1) {
      console.log("🎉 Purchase successful!");
      
      // Check balance
      const balance = await relics.balanceOf(deployer.address, 0);
      console.log(`Your Rusted Caps (ID 0): ${balance}`);
      
      // Now test sacrificeKeys
      console.log("\n🚀 Testing sacrificeKeys with new caps...");
      const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", addresses.baseSepolia.MawSacrifice);
      
      const sacrificeTx = await maw.sacrificeKeys(1, {
        gasLimit: 1500000
      });
      
      const sacrificeReceipt = await sacrificeTx.wait();
      if (sacrificeReceipt.status === 1) {
        console.log("🎉🎉🎉 FULL FLOW WORKS!");
        console.log("KeyShop → Rusted Caps → sacrificeKeys → Relics!");
        
        // Show what was minted
        for (const log of sacrificeReceipt.logs) {
          try {
            const parsed = relics.interface.parseLog(log);
            if (parsed && parsed.name === 'TransferSingle' && parsed.args.from === ethers.ZeroAddress) {
              console.log(`🏆 Minted: ${parsed.args.value} of token ID ${parsed.args.id}`);
            }
          } catch (e) {}
        }
      } else {
        console.log("❌ SacrificeKeys failed");
      }
      
    } else {
      console.log("❌ Purchase failed");
    }
    
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }
  
  console.log(`\n📝 Update addresses.json with new KeyShop:`);
  console.log(`"KeyShop": "${keyShopAddress}"`);
}

main().catch(console.error);