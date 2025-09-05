const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🎨 Directly updating cosmetics contract authorization...");
  console.log("New MawSacrifice Proxy:", addresses.baseSepolia.MawSacrifice);
  console.log("Cosmetics Contract:", addresses.baseSepolia.Cosmetics);
  console.log("");

  try {
    // The key insight: the cosmetics contract is owned by the old V4 contract
    // But we own the old V4 contract, so we should be able to make transactions through it
    
    const cosmetics = await hre.ethers.getContractAt(
      "CosmeticsV2", 
      addresses.baseSepolia.Cosmetics
    );

    console.log("Current cosmetics owner:", await cosmetics.owner());
    console.log("Current mawSacrifice auth:", await cosmetics.mawSacrifice());
    console.log("");

    // Try calling setContracts directly - this should work if we have the right permissions
    console.log("🔄 Attempting to call setContracts directly...");
    console.log("Setting mawSacrifice to:", addresses.baseSepolia.MawSacrifice);
    
    // This will fail if we don't own the cosmetics contract
    const tx = await cosmetics.setContracts(
      addresses.baseSepolia.Raccoons,      // Keep existing raccoons
      addresses.baseSepolia.MawSacrifice   // NEW MawSacrifice proxy
    );
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    
    console.log("");
    console.log("✅ Success! Checking new authorization...");
    const newAuth = await cosmetics.mawSacrifice();
    console.log("New mawSacrifice auth:", newAuth);
    
    if (newAuth.toLowerCase() === addresses.baseSepolia.MawSacrifice.toLowerCase()) {
      console.log("✅ Perfect! New proxy is now authorized for cosmetics!");
    } else {
      console.log("❌ Something went wrong - authorization didn't update");
    }
    
  } catch (error) {
    console.error("Direct call failed:", error.message);
    console.log("\n💡 We need to transfer cosmetics ownership to user first");
    console.log("   The cosmetics contract is owned by the old V4 contract, not the user");
    
    // Let's try to get the ownership transferred
    console.log("\n🔄 Attempting to transfer cosmetics ownership via encoded call...");
    
    const oldV4Address = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
    const oldV4 = await hre.ethers.getContractAt(
      "MawSacrificeV4Upgradeable", 
      oldV4Address
    );
    
    // Create the encoded function call for transferOwnership
    const cosmeticsInterface = new hre.ethers.Interface([
      "function transferOwnership(address newOwner)"
    ]);
    
    const transferOwnershipData = cosmeticsInterface.encodeFunctionData(
      "transferOwnership", 
      [signer.address]
    );
    
    console.log("Encoded transferOwnership call:", transferOwnershipData);
    console.log("This would transfer cosmetics ownership to user:", signer.address);
    console.log("");
    console.log("❌ However, the old V4 contract doesn't have a generic 'call' function");
    console.log("   We need the old V4 contract to have a specific function for this");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});