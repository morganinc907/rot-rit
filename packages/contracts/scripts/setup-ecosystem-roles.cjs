const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 Setting up ecosystem role authorizations...");
  
  const PROXY = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const KEYSHOP = "0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6";
  const COSMETICS = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  
  console.log("Proxy:", PROXY);
  console.log("KeyShop:", KEYSHOP);
  console.log("Cosmetics:", COSMETICS);
  
  const maw = await ethers.getContractAt("MawSacrificeV5", PROXY);
  
  // Calculate role hashes
  const keyShopRole = ethers.keccak256(ethers.toUtf8Bytes("KEY_SHOP"));
  const cosmeticsRole = ethers.keccak256(ethers.toUtf8Bytes("COSMETICS"));
  
  console.log("\n🧮 Role hashes:");
  console.log("KEY_SHOP:", keyShopRole);
  console.log("COSMETICS:", cosmeticsRole);
  
  try {
    // Set KeyShop role
    console.log("\n🛒 Setting up KeyShop role...");
    const keyShopTx = await maw.setRole(keyShopRole, KEYSHOP, {
      gasLimit: 200000
    });
    
    console.log("KeyShop role transaction:", keyShopTx.hash);
    await keyShopTx.wait();
    console.log("✅ KeyShop role set successfully!");
    
    // Set Cosmetics role
    console.log("\n💄 Setting up Cosmetics role...");
    const cosmeticsTx = await maw.setRole(cosmeticsRole, COSMETICS, {
      gasLimit: 200000
    });
    
    console.log("Cosmetics role transaction:", cosmeticsTx.hash);
    await cosmeticsTx.wait();
    console.log("✅ Cosmetics role set successfully!");
    
    // Verify roles are set
    console.log("\n🔍 Verifying roles...");
    const keyShopHolder = await maw.role(keyShopRole);
    const cosmeticsHolder = await maw.role(cosmeticsRole);
    
    console.log("KEY_SHOP role holder:", keyShopHolder);
    console.log("COSMETICS role holder:", cosmeticsHolder);
    
    if (keyShopHolder === KEYSHOP && cosmeticsHolder === COSMETICS) {
      console.log("\n🎉 All ecosystem roles configured successfully!");
      console.log("✅ KeyShop can now mint keys via MAW");
      console.log("✅ Cosmetics can now mint items via MAW");
    } else {
      console.log("\n❌ Role verification failed!");
    }
    
  } catch (error) {
    console.error("❌ Error setting up roles:", error.message);
  }
}

main().catch(console.error);