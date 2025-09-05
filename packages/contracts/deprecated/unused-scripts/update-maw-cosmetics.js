const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🔄 Updating MawSacrifice to use new cosmetics...");
  console.log("User:", signer.address);
  console.log("MawSacrifice:", addresses.baseSepolia.MawSacrifice);
  console.log("New Cosmetics:", addresses.baseSepolia.Cosmetics);
  console.log("");

  try {
    const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", addresses.baseSepolia.MawSacrifice);
    
    // Check current owner
    const owner = await mawSacrifice.owner();
    console.log("MawSacrifice owner:", owner);
    console.log("Expected owner:", signer.address);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("❌ We don't own the MawSacrifice contract!");
      return;
    }

    console.log("✅ Ownership verified!");
    console.log("");

    // Update contracts - use setContracts function
    console.log("🔄 Calling setContracts...");
    
    const tx = await mawSacrifice.setContracts(
      addresses.baseSepolia.Relics,     // Keep same relics
      addresses.baseSepolia.Cosmetics,  // NEW cosmetics
      addresses.baseSepolia.Demons,     // Keep same demons
      addresses.baseSepolia.Cultists    // Keep same cultists
    );
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Contract addresses updated!");
    console.log("");

    // Verify the update
    console.log("🔍 Verifying update...");
    const newCosmeticsAddress = await mawSacrifice.cosmetics();
    console.log("New cosmetics address in Maw:", newCosmeticsAddress);
    console.log("Expected:", addresses.baseSepolia.Cosmetics);
    
    if (newCosmeticsAddress.toLowerCase() === addresses.baseSepolia.Cosmetics.toLowerCase()) {
      console.log("✅ SUCCESS! MawSacrifice now uses new cosmetics!");
      console.log("");
      console.log("🧪 Ready to test cosmetic sacrifices!");
    } else {
      console.log("❌ Update failed - addresses don't match");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});