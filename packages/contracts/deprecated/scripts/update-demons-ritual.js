const hre = require("hardhat");

async function main() {
  console.log("👹 Updating Demons ritual address to proxy...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Updating with account:", deployer.address);

  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const DEMONS_ADDRESS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";

  try {
    const demons = await hre.ethers.getContractAt("Demons", DEMONS_ADDRESS);
    
    const currentRitual = await demons.ritual();
    console.log("Current ritual address:", currentRitual);
    console.log("Target proxy address:", PROXY_ADDRESS);
    
    if (currentRitual.toLowerCase() === PROXY_ADDRESS.toLowerCase()) {
      console.log("✅ Proxy is already set as ritual on Demons");
    } else {
      console.log("🔄 Setting proxy as ritual address...");
      
      // Add some gas buffer and higher gas price to avoid underpriced error
      const tx = await demons.setRitual(PROXY_ADDRESS, {
        gasPrice: hre.ethers.parseUnits("2", "gwei"), // Higher gas price
        gasLimit: 100000 // Gas limit buffer
      });
      
      console.log("📤 Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
      console.log("✅ Proxy set as ritual on Demons");
    }

    // Verify the update
    const newRitual = await demons.ritual();
    console.log("\n📋 Verification:");
    console.log("  New ritual address:", newRitual);
    console.log("  Matches proxy:", newRitual.toLowerCase() === PROXY_ADDRESS.toLowerCase());

  } catch (error) {
    console.error("❌ Update failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });