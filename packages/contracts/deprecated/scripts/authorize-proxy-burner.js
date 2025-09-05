const hre = require("hardhat");

async function main() {
  console.log("🔑 Authorizing UUPS Proxy as burner on contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Authorizing with account:", deployer.address);

  // Proxy address (our stable address)
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  // Get current addresses
  const addresses = require("../../addresses/addresses.json");
  const network = hre.network.name;
  const currentAddresses = addresses[network];

  console.log("📋 Contract Addresses:");
  console.log("  Proxy (MawSacrifice):", PROXY_ADDRESS);
  console.log("  Relics:", currentAddresses.Relics);
  console.log("  Demons:", currentAddresses.Demons);
  console.log("  Cultists:", currentAddresses.Cultists);
  console.log();

  try {
    // 1. Authorize proxy as burner on Relics
    console.log("1️⃣ Authorizing proxy as burner on Relics...");
    const relics = await hre.ethers.getContractAt("Relics", currentAddresses.Relics);
    
    // Check current mawSacrifice address
    const currentMawSacrifice = await relics.mawSacrifice();
    console.log("  Current mawSacrifice:", currentMawSacrifice);
    
    if (currentMawSacrifice.toLowerCase() === PROXY_ADDRESS.toLowerCase()) {
      console.log("✅ Proxy is already set as mawSacrifice on Relics");
    } else {
      const tx = await relics.setMawSacrifice(PROXY_ADDRESS);
      await tx.wait();
      console.log("✅ Proxy set as mawSacrifice on Relics");
      console.log("  Transaction:", tx.hash);
    }

    // 2. Update Demons ritual address
    console.log("\n2️⃣ Setting proxy as ritual address on Demons...");
    const demons = await hre.ethers.getContractAt("Demons", currentAddresses.Demons);
    
    const currentRitual = await demons.ritual();
    console.log("  Current ritual address:", currentRitual);
    
    if (currentRitual.toLowerCase() === PROXY_ADDRESS.toLowerCase()) {
      console.log("✅ Proxy is already set as ritual on Demons");
    } else {
      const tx = await demons.setRitual(PROXY_ADDRESS);
      await tx.wait();
      console.log("✅ Proxy set as ritual on Demons");
      console.log("  Transaction:", tx.hash);
    }

    // 3. Check/Update Cosmetics authorization (if needed)
    console.log("\n3️⃣ Checking Cosmetics mawSacrifice address...");
    try {
      const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", currentAddresses.Cosmetics);
      const currentCosmeticsMaw = await cosmetics.mawSacrifice();
      console.log("  Current cosmetics mawSacrifice:", currentCosmeticsMaw);
      
      if (currentCosmeticsMaw.toLowerCase() === PROXY_ADDRESS.toLowerCase()) {
        console.log("✅ Proxy is already set as mawSacrifice on Cosmetics");
      } else {
        const tx = await cosmetics.setMawSacrifice(PROXY_ADDRESS);
        await tx.wait();
        console.log("✅ Proxy set as mawSacrifice on Cosmetics");
        console.log("  Transaction:", tx.hash);
      }
    } catch (error) {
      console.log("⚠️  Cosmetics update failed:", error.message.slice(0, 100));
    }

    // 4. Verify all authorizations
    console.log("\n4️⃣ Verifying all authorizations...");
    
    const relicsMaw = await relics.mawSacrifice();
    const demonsRitual = await demons.ritual();
    
    console.log("✅ Final verification:");
    console.log("  Relics mawSacrifice:", relicsMaw);
    console.log("  Demons ritual:", demonsRitual);
    console.log("  Proxy address:", PROXY_ADDRESS);

    const relicsOk = relicsMaw.toLowerCase() === PROXY_ADDRESS.toLowerCase();
    const demonsOk = demonsRitual.toLowerCase() === PROXY_ADDRESS.toLowerCase();
    
    if (relicsOk && demonsOk) {
      console.log("\n🎉 All contract authorizations complete!");
      console.log("✅ Proxy can now burn/mint Relics");
      console.log("✅ Proxy can now mint Demons");
      console.log("✅ System is ready for testing");
    } else {
      console.log("\n❌ Some authorizations failed - check logs above");
      console.log("  Relics OK:", relicsOk);
      console.log("  Demons OK:", demonsOk);
    }

    return {
      proxyAddress: PROXY_ADDRESS,
      relicsAuthorized: relicsOk,
      demonsRitual: demonsRitual,
      success: relicsOk && demonsOk
    };

  } catch (error) {
    console.error("❌ Authorization failed:", error.message);
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