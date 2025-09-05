const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🎨 Simple cosmetics authorization fix...");
  console.log("User:", signer.address);
  console.log("New MawSacrifice Proxy:", addresses.baseSepolia.MawSacrifice);
  console.log("Cosmetics Contract:", addresses.baseSepolia.Cosmetics);
  console.log("");

  try {
    // The problem: Cosmetics is owned by old V4 contract
    // Solution: Make old V4 contract owner (me) call setContracts via delegatecall or low-level call
    
    // First, let's verify current status
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", addresses.baseSepolia.Cosmetics);
    console.log("Current cosmetics owner:", await cosmetics.owner());
    console.log("Current mawSacrifice auth:", await cosmetics.mawSacrifice());
    console.log("");

    // The key insight: Since I own the old V4 contract, I should be able to make it call functions
    // Let me try a direct approach using the wallet/provider to impersonate the old V4 contract
    
    const oldV4Address = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
    console.log("Old V4 contract address:", oldV4Address);
    
    // Create the transaction data for setContracts
    const cosmeticsInterface = new hre.ethers.Interface([
      "function setContracts(address _raccoons, address _mawSacrifice)"
    ]);
    
    const setContractsData = cosmeticsInterface.encodeFunctionData("setContracts", [
      addresses.baseSepolia.Raccoons,
      addresses.baseSepolia.MawSacrifice
    ]);
    
    console.log("🔄 Attempting to call setContracts from old V4 contract...");
    console.log("Target:", addresses.baseSepolia.Cosmetics);
    console.log("Data:", setContractsData);
    
    // Try to send this transaction from the old V4 contract
    // This requires the old V4 contract to have a way to make arbitrary calls
    console.log("❌ This approach won't work - old V4 doesn't have a generic call function");
    
    console.log("\n💡 Alternative: Deploy helper contract as old V4 contract owner");
    console.log("   Then transfer cosmetics ownership to helper, fix it, transfer back");
    
    // Deploy the helper contract
    console.log("🚀 Deploying CosmeticsOwnershipHelper...");
    const CosmeticsOwnershipHelper = await hre.ethers.getContractFactory("CosmeticsOwnershipHelper");
    const helper = await CosmeticsOwnershipHelper.deploy();
    await helper.waitForDeployment();
    
    const helperAddress = await helper.getAddress();
    console.log("✅ Helper deployed to:", helperAddress);
    
    console.log("❌ But this still doesn't solve the problem - cosmetics is owned by old V4, not by user");
    console.log("   We need the old V4 contract to transfer ownership to the helper");
    console.log("   But old V4 doesn't have that capability");
    
    console.log("\n🎯 REAL SOLUTION: Use cast or foundry to impersonate the old V4 contract");
    console.log("   Or manually construct and send the transaction as if from old V4");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});