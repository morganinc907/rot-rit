const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing actual transactions on new contract...\n");
  
  const NEW_MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const [signer] = await ethers.getSigners();
  
  const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", NEW_MAW_ADDRESS);
  
  console.log("User:", signer.address);
  console.log("New MawSacrifice:", NEW_MAW_ADDRESS);
  
  try {
    // Test key sacrifice with actual transaction
    console.log("🔑 Testing key sacrifice with actual transaction...");
    
    const tx1 = await maw.sacrificeKeys(1, {
      gasLimit: 500000 // Plenty of gas
    });
    
    console.log("Transaction sent:", tx1.hash);
    const receipt1 = await tx1.wait();
    console.log("✅ Key sacrifice succeeded! Block:", receipt1.blockNumber);
    
    // Wait a bit to avoid anti-bot
    console.log("⏳ Waiting for next block...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test cosmetic sacrifice
    console.log("🎨 Testing cosmetic sacrifice with actual transaction...");
    
    const tx2 = await maw.sacrificeForCosmetic(1, 0, {
      gasLimit: 500000 // Plenty of gas
    });
    
    console.log("Transaction sent:", tx2.hash);
    const receipt2 = await tx2.wait();
    console.log("✅ Cosmetic sacrifice succeeded! Block:", receipt2.blockNumber);
    
    console.log("\n🎉 Both sacrifices work perfectly from contract side!");
    console.log("The issue must be in the frontend transaction building.");
    
  } catch (error) {
    console.error("❌ Transaction failed:", error);
    
    if (error.data) {
      console.log("Error data:", error.data);
    }
    
    if (error.message.includes("revert")) {
      console.log("This is a contract revert - checking revert reason...");
    }
  }
}

main().catch(console.error);