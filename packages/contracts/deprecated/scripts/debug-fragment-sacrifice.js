const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🔍 Debugging fragment sacrifice with account:", signer.address);
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const MAW_ADDRESS = "0xA61e36FEdf83EFA9A1F0996063fA633FC30D15ed";
  
  // Get contracts
  const relicsABI = [
    "function balanceOf(address account, uint256 id) view returns (uint256)",
    "function isApprovedForAll(address account, address operator) view returns (bool)"
  ];
  
  const mawABI = [
    "function sacrificeForCosmetic(uint256 fragmentAmount, uint256 fragmentType) external"
  ];
  
  const relics = new ethers.Contract(RELICS_ADDRESS, relicsABI, signer);
  const maw = new ethers.Contract(MAW_ADDRESS, mawABI, signer);
  
  console.log("\n📊 CURRENT BALANCES:");
  for (let i = 1; i <= 8; i++) {
    const balance = await relics.balanceOf(signer.address, i);
    if (balance > 0) {
      console.log(`Token ID ${i}: ${balance}`);
    }
  }
  
  console.log("\n🔍 APPROVAL STATUS:");
  const isApproved = await relics.isApprovedForAll(signer.address, MAW_ADDRESS);
  console.log("Approved for all:", isApproved);
  
  console.log("\n🧪 TESTING FRAGMENT SACRIFICE:");
  console.log("Attempting to sacrifice 3 lantern fragments (ID 2)...");
  
  try {
    // Test the call that was failing
    const tx = await maw.sacrificeForCosmetic(3, 2);
    console.log("✅ Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction successful! Block:", receipt.blockNumber);
    
  } catch (error) {
    console.error("❌ Transaction failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Issue: Not enough tokens to sacrifice");
    } else if (error.message.includes("not approved")) {
      console.log("💡 Issue: Contract not approved");
    } else if (error.message.includes("paused")) {
      console.log("💡 Issue: Contract is paused");
    } else {
      console.log("💡 Issue: Unknown error - contract might have a bug");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });