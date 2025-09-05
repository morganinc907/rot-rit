const { ethers } = require("hardhat");

async function main() {
  console.log("🔥 Granting burn authority to dev contract...");

  const [signer] = await ethers.getSigners();
  
  // Contract addresses
  const devMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  console.log(`Dev Contract: ${devMawAddress}`);
  console.log(`Relics Contract: ${relicsAddress}`);
  
  // Get relics contract
  const relics = await ethers.getContractAt("Relics", relicsAddress);
  
  // Get BURNER_ROLE hash - it's a public constant
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
  console.log(`BURNER_ROLE: ${BURNER_ROLE}`);
  
  // Check if dev contract already has burn authority
  const hasBurnRole = await relics.hasRole(BURNER_ROLE, devMawAddress);
  console.log(`Dev contract has burn role: ${hasBurnRole}`);
  
  if (!hasBurnRole) {
    console.log("📞 Granting BURNER_ROLE to dev contract...");
    const tx = await relics.grantRole(BURNER_ROLE, devMawAddress);
    console.log(`Transaction: ${tx.hash}`);
    await tx.wait();
    console.log("✅ BURNER_ROLE granted!");
  } else {
    console.log("✅ Dev contract already has burn role");
  }
  
  // Verify
  const hasRoleAfter = await relics.hasRole(BURNER_ROLE, devMawAddress);
  console.log(`Verification - has burn role: ${hasRoleAfter}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });