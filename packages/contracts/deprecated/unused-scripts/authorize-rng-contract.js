const hre = require("hardhat");
const { ethers } = hre;
const addresses = require('../../addresses/addresses.json');

async function main() {
    console.log("🔐 Authorizing RNG fix contract...");
    
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);
    
    const contractAddresses = addresses.baseSepolia;
    const RNG_FIX_ADDRESS = contractAddresses.MawSacrifice; // 0xE9F133387d1bA847Cf25c391f01D5CFE6D151083
    
    console.log("\n📍 Contract addresses:");
    console.log("RNG Fix MawSacrifice:", RNG_FIX_ADDRESS);
    console.log("Relics:", contractAddresses.Relics);
    console.log("Cosmetics:", contractAddresses.Cosmetics);
    
    // Authorize with Relics
    console.log("\n1️⃣ Authorizing with Relics contract...");
    const relics = await ethers.getContractAt("Relics", contractAddresses.Relics);
    
    try {
        const currentMaw = await relics.mawSacrifice();
        console.log("Current authorized Maw:", currentMaw);
        
        if (currentMaw.toLowerCase() === RNG_FIX_ADDRESS.toLowerCase()) {
            console.log("✅ Already authorized with Relics!");
        } else {
            const tx1 = await relics.setMawSacrifice(RNG_FIX_ADDRESS);
            await tx1.wait();
            console.log("✅ Authorized with Relics!");
        }
    } catch (error) {
        console.log("❌ Failed to authorize with Relics:", error.message);
    }
    
    // Authorize with Cosmetics
    console.log("\n2️⃣ Authorizing with Cosmetics contract...");
    const cosmetics = await ethers.getContractAt("contracts/MawSacrificeV4Upgradeable.sol:ICosmeticsV2", contractAddresses.Cosmetics);
    
    try {
        // Check current contracts
        const currentContracts = await cosmetics.contracts();
        console.log("Current authorized contracts:");
        console.log("  Maw:", currentContracts.mawSacrifice);
        console.log("  KeyShop:", currentContracts.keyShop);
        console.log("  Ritual:", currentContracts.ritual);
        
        if (currentContracts.mawSacrifice.toLowerCase() === RNG_FIX_ADDRESS.toLowerCase()) {
            console.log("✅ Already authorized with Cosmetics!");
        } else {
            // Set all three addresses (maw, keyshop, ritual)
            const tx2 = await cosmetics.setContracts(
                RNG_FIX_ADDRESS,                // mawSacrifice
                contractAddresses.KeyShop,      // keyShop (keep existing)
                RNG_FIX_ADDRESS                  // ritual (same as maw)
            );
            await tx2.wait();
            console.log("✅ Authorized with Cosmetics!");
        }
    } catch (error) {
        console.log("❌ Failed to authorize with Cosmetics:", error.message);
    }
    
    // Grant roles if needed
    console.log("\n3️⃣ Checking roles on Relics...");
    try {
        const MAW_ROLE = await relics.MAW_ROLE();
        const hasRole = await relics.hasRole(MAW_ROLE, RNG_FIX_ADDRESS);
        console.log("Has MAW_ROLE:", hasRole);
        
        if (!hasRole) {
            console.log("Granting MAW_ROLE...");
            const tx3 = await relics.grantRole(MAW_ROLE, RNG_FIX_ADDRESS);
            await tx3.wait();
            console.log("✅ MAW_ROLE granted!");
        }
    } catch (error) {
        console.log("Note: Role check failed (may be automatic):", error.message);
    }
    
    // Verify setup
    console.log("\n✅ Verification:");
    try {
        const finalMaw = await relics.mawSacrifice();
        console.log("Relics authorized Maw:", finalMaw);
        
        const finalContracts = await cosmetics.contracts();
        console.log("Cosmetics authorized Maw:", finalContracts.mawSacrifice);
        
        if (finalMaw.toLowerCase() === RNG_FIX_ADDRESS.toLowerCase() &&
            finalContracts.mawSacrifice.toLowerCase() === RNG_FIX_ADDRESS.toLowerCase()) {
            console.log("\n🎉 RNG fix contract is fully authorized!");
        } else {
            console.log("\n⚠️ Authorization may be incomplete");
        }
    } catch (error) {
        console.log("Could not verify:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });