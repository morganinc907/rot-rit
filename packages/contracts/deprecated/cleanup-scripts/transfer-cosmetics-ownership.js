const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🎨 Transferring cosmetics ownership/authorization...");
  console.log("New MawSacrifice Proxy:", addresses.baseSepolia.MawSacrifice);
  console.log("Cosmetics Contract:", addresses.baseSepolia.Cosmetics);
  console.log("User address:", signer.address);
  console.log("");

  // Connect to cosmetics contract
  const cosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2", 
    addresses.baseSepolia.Cosmetics
  );

  try {
    const owner = await cosmetics.owner();
    console.log("Current cosmetics owner:", owner);
    console.log("Current mawSacrifice auth:", await cosmetics.mawSacrifice());
    console.log("");

    // Approach 1: Try to transfer ownership from old contract to user first
    console.log("📋 Step 1: Transfer cosmetics ownership to user...");
    const oldV4 = await hre.ethers.getContractAt(
      "MawSacrificeV4Upgradeable", 
      owner // The old contract is the current owner
    );

    // Try to call transferOwnership on cosmetics through old contract
    console.log("🔄 Attempting to transfer cosmetics ownership...");
    
    // Check if we own the old contract first
    const oldContractOwner = await oldV4.owner();
    console.log("Old V4 contract owner:", oldContractOwner);
    
    if (oldContractOwner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("❌ We don't own the old V4 contract!");
      console.log("Expected:", signer.address);
      console.log("Actual:", oldContractOwner);
      return;
    }

    // We own the old contract, so we can use it to transfer cosmetics ownership
    console.log("✅ We own the old V4 contract!");
    console.log("🔄 Using old contract to transfer cosmetics ownership...");
    
    // The old contract owns cosmetics, so we need to call transferOwnership on cosmetics
    // But we need to do this through contract interaction, not directly
    console.log("💡 We need to transfer cosmetics ownership to user first");
    
    // Connect to cosmetics as the old contract (the owner)
    const cosmeticsAsOldContract = await hre.ethers.getContractAt(
      "CosmeticsV2", 
      addresses.baseSepolia.Cosmetics,
      signer // We control the old contract that owns cosmetics
    );

    // Transfer cosmetics ownership to user
    const transferTx = await cosmetics.transferOwnership(signer.address);
    console.log("Transfer transaction:", transferTx.hash);
    await transferTx.wait();
    console.log("✅ Cosmetics ownership transferred to user!");
    
    console.log("");
    console.log("📋 Step 2: Set new MawSacrifice authorization...");
    
    // Now set the new MawSacrifice authorization
    const setTx = await cosmetics.setContracts(
      addresses.baseSepolia.Raccoons, // Keep existing raccoons
      addresses.baseSepolia.MawSacrifice // New MawSacrifice proxy
    );
    console.log("SetContracts transaction:", setTx.hash);
    await setTx.wait();
    
    console.log("");
    console.log("🔍 Verifying new setup...");
    console.log("New cosmetics owner:", await cosmetics.owner());
    console.log("New mawSacrifice auth:", await cosmetics.mawSacrifice());
    console.log("✅ Cosmetics authorization updated!");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});