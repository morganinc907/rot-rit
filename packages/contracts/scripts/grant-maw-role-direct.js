const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Directly granting MAW_ROLE to proxy...");
  
  const [signer] = await ethers.getSigners();
  const networkAddresses = addresses.baseSepolia;
  const relics = await ethers.getContractAt("Relics", networkAddresses.Relics);
  
  console.log("Signer:", signer.address);
  console.log("Proxy address:", networkAddresses.MawSacrifice);
  
  // Get MAW_ROLE hash
  const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  console.log("MAW_ROLE hash:", MAW_ROLE);
  
  try {
    console.log("Granting role...");
    const tx = await relics.grantRole(MAW_ROLE, networkAddresses.MawSacrifice);
    await tx.wait();
    console.log("✅ Role granted! Hash:", tx.hash);
  } catch (error) {
    console.log("❌ Failed to grant role:", error.message);
  }
}

main().catch(console.error);
