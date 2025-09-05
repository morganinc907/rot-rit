const { ethers } = require("hardhat");

async function main() {
  console.log("🔗 Checking ownership chain...");

  const [signer] = await ethers.getSigners();
  const userAddress = signer.address;
  
  // Contract addresses
  const oldMawAddress = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const cosmeticsAddress = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  console.log(`User: ${userAddress}`);
  console.log(`Old MawSacrifice: ${oldMawAddress}`);
  console.log(`Cosmetics: ${cosmeticsAddress}`);
  
  // Check cosmetics ownership
  const cosmetics = await ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  const cosmeticsOwner = await cosmetics.owner();
  console.log(`Cosmetics owner: ${cosmeticsOwner}`);
  
  // Check old MawSacrifice ownership
  try {
    const oldMaw = await ethers.getContractAt("MawSacrificeV4Upgradeable", oldMawAddress);
    const oldMawOwner = await oldMaw.owner();
    console.log(`Old MawSacrifice owner: ${oldMawOwner}`);
    
    // Check if I can control the old contract
    if (oldMawOwner.toLowerCase() === userAddress.toLowerCase()) {
      console.log("✅ You own the old MawSacrifice contract!");
      console.log("💡 You can use the old contract to transfer cosmetics ownership");
    } else {
      console.log("❌ You don't own the old MawSacrifice contract");
    }
  } catch (error) {
    console.error("Error checking old MawSacrifice:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });