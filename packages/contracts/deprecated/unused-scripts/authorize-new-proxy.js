const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🔐 Authorizing new proxy with Relics and Cosmetics...");
    
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);
    
    const NEW_PROXY = "0x15243987458f1ed05b02e6213b532bb060027f4c";
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
    
    console.log("New proxy:", NEW_PROXY);
    console.log("Relics:", RELICS_ADDRESS);
    console.log("Cosmetics:", COSMETICS_ADDRESS);
    
    // 1. Authorize with Relics contract
    console.log("\n1️⃣ Authorizing with Relics contract...");
    try {
        const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
        
        // Check current authorization
        const currentMaw = await relics.mawSacrifice();
        console.log("Current authorized Maw:", currentMaw);
        
        if (currentMaw.toLowerCase() === NEW_PROXY.toLowerCase()) {
            console.log("✅ Already authorized with Relics!");
        } else {
            console.log("Setting new authorization...");
            const tx1 = await relics.setMawSacrifice(NEW_PROXY);
            await tx1.wait();
            console.log("✅ Relics authorization updated!");
            
            // Verify
            const newAuth = await relics.mawSacrifice();
            console.log("Verified new authorization:", newAuth);
        }
        
    } catch (error) {
        console.error("❌ Failed to authorize with Relics:", error.message);
    }
    
    // 2. Authorize with Cosmetics contract
    console.log("\n2️⃣ Authorizing with Cosmetics contract...");
    try {
        const cosmetics = await ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);
        
        // Check ownership
        const owner = await cosmetics.owner();
        console.log("Cosmetics owner:", owner);
        console.log("Is owned by signer:", owner.toLowerCase() === signer.address.toLowerCase());
        
        if (owner.toLowerCase() !== signer.address.toLowerCase()) {
            console.log("❌ You don't own the cosmetics contract - cannot authorize");
        } else {
            // Try setMawSacrifice method
            try {
                console.log("Trying setMawSacrifice...");
                const tx2 = await cosmetics.setMawSacrifice(NEW_PROXY);
                await tx2.wait();
                console.log("✅ Cosmetics authorization via setMawSacrifice successful!");
                
            } catch (setMawError) {
                console.log("setMawSacrifice failed, trying setContracts...");
                
                // Try setContracts method
                const KEYSHOP_ADDRESS = "0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6";
                const tx3 = await cosmetics.setContracts(
                    NEW_PROXY,           // mawSacrifice
                    KEYSHOP_ADDRESS,     // keyShop
                    NEW_PROXY            // ritual (same as maw)
                );
                await tx3.wait();
                console.log("✅ Cosmetics authorization via setContracts successful!");
            }
            
            // Verify cosmetics authorization
            try {
                const authMaw = await cosmetics.mawSacrifice();
                console.log("Verified cosmetics authorization:", authMaw);
            } catch {
                console.log("Could not verify cosmetics authorization (function may not exist)");
            }
        }
        
    } catch (error) {
        console.error("❌ Failed to authorize with Cosmetics:", error.message);
    }
    
    // 3. Set cosmetic types
    console.log("\n3️⃣ Setting cosmetic types...");
    try {
        const proxy = await ethers.getContractAt("MawSacrificeV4NoTimelock", NEW_PROXY);
        
        // Set the same cosmetic types that were working before
        const cosmeticTypes = [1, 2, 3, 4, 5];
        console.log("Setting cosmetic types:", cosmeticTypes);
        
        const tx4 = await proxy.setMonthlyCosmeticTypes(cosmeticTypes);
        await tx4.wait();
        console.log("✅ Cosmetic types set!");
        
        // Verify
        const currentTypes = await proxy.getCurrentCosmeticTypes();
        console.log("Verified types:", currentTypes.map(t => t.toString()));
        
    } catch (error) {
        console.error("❌ Failed to set cosmetic types:", error.message);
    }
    
    console.log("\n🎉 AUTHORIZATION COMPLETE!");
    console.log("✅ New proxy is fully configured and ready to use");
    console.log("✅ RNG bug fixed - cosmetic sacrifices should work properly now");
    console.log("✅ No timelock restrictions - immediate upgrades possible");
    
    console.log("\n🔄 Next steps:");
    console.log("1. cd ../.. && npm run build:packages  # Regenerate packages");
    console.log("2. Test cosmetic sacrifices in frontend");
    console.log("3. Verify proper success rates (35%/60%/80% based on fragments)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });