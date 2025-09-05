const { ethers } = require("hardhat");
const { ADDRS, CHAIN } = require("@rot-ritual/addresses");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing with account:", signer.address);

  const mawAddress = ADDRS[CHAIN.BASE_SEPOLIA].MawSacrifice;
  const relicsAddress = ADDRS[CHAIN.BASE_SEPOLIA].Relics;
  
  console.log("Maw contract:", mawAddress);
  console.log("Relics contract:", relicsAddress);

  // Get current contract implementation
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", mawAddress);
  const relics = await ethers.getContractAt("IRelics", relicsAddress);

  try {
    // Check user's rusted caps balance
    const balance = await relics.balanceOf(signer.address, 0);
    console.log("Rusted caps balance:", balance.toString());

    if (balance === 0n) {
      console.log("❌ No rusted caps to sacrifice");
      return;
    }

    // Check if user has approved the maw contract
    const approved = await relics.isApprovedForAll(signer.address, mawAddress);
    console.log("Is approved for all:", approved);

    if (!approved) {
      console.log("⚠️ Need to approve first. Setting approval...");
      const approveTx = await relics.setApprovalForAll(mawAddress, true);
      await approveTx.wait();
      console.log("✅ Approval set");
    }

    // Check contract state
    const paused = await maw.paused();
    const sacrificesPaused = await maw.sacrificesPaused();
    console.log("Contract paused:", paused);
    console.log("Sacrifices paused:", sacrificesPaused);

    if (paused || sacrificesPaused) {
      console.log("❌ Contract or sacrifices are paused");
      return;
    }

    // Try to sacrifice 1 rusted cap
    console.log("\n🔥 Attempting to sacrifice 1 rusted cap...");
    const tx = await maw.sacrificeKeys(1n);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check events
    const events = receipt.logs;
    console.log("Events emitted:", events.length);
    for (const event of events) {
      console.log("Event:", event.fragment?.name || "Unknown", event.args || event.data);
    }

    // Check new balance
    const newBalance = await relics.balanceOf(signer.address, 0);
    console.log("New rusted caps balance:", newBalance.toString());
    console.log("Difference:", (balance - newBalance).toString());

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    if (error.data) {
      console.error("Data:", error.data);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});